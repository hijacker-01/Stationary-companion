from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.sales import SalesInvoice
from app.models.purchase import PurchaseInvoice
from app.models.inventory import ItemBatch


def get_kpi_summary(db: Session, company_id: str, branch_id: str):
    total_sales = db.query(func.coalesce(func.sum(SalesInvoice.total_amount), 0)).filter(
        SalesInvoice.company_id == company_id,
        SalesInvoice.branch_id == branch_id,
        SalesInvoice.is_deleted.is_(False),
    ).scalar()

    total_purchases = db.query(func.coalesce(func.sum(PurchaseInvoice.total_amount), 0)).filter(
        PurchaseInvoice.company_id == company_id,
        PurchaseInvoice.branch_id == branch_id,
        PurchaseInvoice.is_deleted.is_(False),
    ).scalar()

    low_stock_count = db.query(ItemBatch).filter(
        ItemBatch.company_id == company_id,
        ItemBatch.branch_id == branch_id,
        ItemBatch.quantity <= 5,
        ItemBatch.is_deleted.is_(False),
    ).count()

    near_expiry_count = 0
    return {
        "total_sales": float(total_sales or 0),
        "total_purchases": float(total_purchases or 0),
        "gross_margin": float((total_sales or 0) - (total_purchases or 0)),
        "low_stock_count": low_stock_count,
        "near_expiry_count": near_expiry_count,
    }
