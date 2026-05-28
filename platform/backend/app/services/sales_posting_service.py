from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.inventory import ItemBatch
from app.models.sales import SalesInvoice, SalesInvoiceLine
from app.models.stock import StockMovement
from app.services.accounting_posting_service import post_sales_journal
from app.services.ledger_config_service import resolve_ledgers


def create_sales_invoice(db: Session, payload):
    taxable_amount = 0.0
    gst_amount = 0.0

    invoice = SalesInvoice(
        company_id=payload.company_id,
        branch_id=payload.branch_id,
        customer_id=payload.customer_id,
        invoice_no=payload.invoice_no,
        invoice_date=payload.invoice_date,
        discount_amount=payload.discount_amount,
        payment_status=payload.payment_status,
    )
    db.add(invoice)
    db.flush()

    for line in payload.lines:
        batch = db.query(ItemBatch).filter(
            ItemBatch.id == line.item_batch_id,
            ItemBatch.company_id == payload.company_id,
            ItemBatch.branch_id == payload.branch_id,
            ItemBatch.is_deleted.is_(False),
        ).with_for_update().first()
        if not batch:
            raise HTTPException(status_code=404, detail=f"Batch not found: {line.item_batch_id}")

        qty_total = line.quantity + line.free_quantity
        if batch.quantity < qty_total:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for batch {line.item_batch_id}. Available={batch.quantity} Required={qty_total}",
            )

        batch.quantity -= qty_total

        line_taxable = line.quantity * line.rate
        line_gst = line_taxable * (line.gst_rate / 100)
        line_total = line_taxable + line_gst

        taxable_amount += line_taxable
        gst_amount += line_gst

        db.add(SalesInvoiceLine(
            company_id=payload.company_id,
            branch_id=payload.branch_id,
            sales_invoice_id=invoice.id,
            item_id=line.item_id,
            item_batch_id=line.item_batch_id,
            quantity=line.quantity,
            free_quantity=line.free_quantity,
            rate=line.rate,
            gst_rate=line.gst_rate,
            line_total=line_total,
        ))
        db.add(StockMovement(
            company_id=payload.company_id,
            branch_id=payload.branch_id,
            item_id=line.item_id,
            item_batch_id=line.item_batch_id,
            movement_type="out",
            reference_type="sales_invoice",
            reference_id=invoice.id,
            quantity=qty_total,
            rate=line.rate,
        ))

    invoice.taxable_amount = taxable_amount
    invoice.gst_amount = gst_amount
    invoice.total_amount = taxable_amount + gst_amount - payload.discount_amount

    ledgers = resolve_ledgers(
        db,
        payload.company_id,
        payload.branch_id,
        {"customer_control", "sales", "gst_output"},
    )

    post_sales_journal(
        db=db,
        company_id=payload.company_id,
        branch_id=payload.branch_id,
        voucher_no=invoice.invoice_no,
        posting_date=invoice.invoice_date,
        customer_ledger_id=ledgers["customer_control"],
        sales_ledger_id=ledgers["sales"],
        gst_output_ledger_id=ledgers["gst_output"],
        taxable_amount=invoice.taxable_amount,
        gst_amount=invoice.gst_amount,
        total_amount=invoice.total_amount,
    )

    return invoice
