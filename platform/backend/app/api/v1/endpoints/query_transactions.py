from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.purchase import PurchaseInvoice
from app.models.sales import SalesInvoice
from app.services.pagination import paginate

router = APIRouter()


@router.get("/purchase-invoices")
def list_purchase_invoices(
    company_id: str,
    branch_id: str,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(PurchaseInvoice).filter(
        PurchaseInvoice.company_id == company_id,
        PurchaseInvoice.branch_id == branch_id,
        PurchaseInvoice.is_deleted.is_(False),
    )
    if search:
        query = query.filter(PurchaseInvoice.invoice_no.ilike(f"%{search}%"))
    query = query.order_by(PurchaseInvoice.created_at.desc())
    return paginate(query, page, page_size)


@router.get("/sales-invoices")
def list_sales_invoices(
    company_id: str,
    branch_id: str,
    page: int = 1,
    page_size: int = 25,
    search: str | None = None,
    db: Session = Depends(get_db),
):
    query = db.query(SalesInvoice).filter(
        SalesInvoice.company_id == company_id,
        SalesInvoice.branch_id == branch_id,
        SalesInvoice.is_deleted.is_(False),
    )
    if search:
        query = query.filter(SalesInvoice.invoice_no.ilike(f"%{search}%"))
    query = query.order_by(SalesInvoice.created_at.desc())
    return paginate(query, page, page_size)
