from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.schemas.transaction import PurchaseCreate, SalesCreate
from app.services.purchase_posting_service import create_purchase_invoice
from app.services.sales_posting_service import create_sales_invoice
from app.services.idempotency_service import get_existing_response, save_response

router = APIRouter()


@router.post("/purchase-invoices")
def post_purchase_invoice(
    payload: PurchaseCreate,
    db: Session = Depends(get_db),
    x_idempotency_key: str | None = Header(default=None),
):
    if x_idempotency_key:
        existing = get_existing_response(db, payload.company_id, payload.branch_id, "purchase_invoice", x_idempotency_key)
        if existing is not None:
            return existing
    with db.begin():
        invoice = create_purchase_invoice(db, payload)
        response = {
            "id": invoice.id,
            "invoice_no": invoice.invoice_no,
            "total_amount": float(invoice.total_amount),
        }
        if x_idempotency_key:
            save_response(db, payload.company_id, payload.branch_id, "purchase_invoice", x_idempotency_key, response)
    return response


@router.post("/sales-invoices")
def post_sales_invoice(
    payload: SalesCreate,
    db: Session = Depends(get_db),
    x_idempotency_key: str | None = Header(default=None),
):
    if x_idempotency_key:
        existing = get_existing_response(db, payload.company_id, payload.branch_id, "sales_invoice", x_idempotency_key)
        if existing is not None:
            return existing
    with db.begin():
        invoice = create_sales_invoice(db, payload)
        response = {
            "id": invoice.id,
            "invoice_no": invoice.invoice_no,
            "total_amount": float(invoice.total_amount),
        }
        if x_idempotency_key:
            save_response(db, payload.company_id, payload.branch_id, "sales_invoice", x_idempotency_key, response)
    return response
