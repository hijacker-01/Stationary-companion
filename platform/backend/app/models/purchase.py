import uuid
from sqlalchemy import String, Date, Numeric, Integer
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin


class PurchaseInvoice(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "purchase_invoices"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    invoice_no: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    supplier_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    invoice_date: Mapped[Date] = mapped_column(Date, nullable=False)
    taxable_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    gst_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    discount_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)


class PurchaseInvoiceLine(Base, TimestampMixin, TenantScopedMixin):
    __tablename__ = "purchase_invoice_lines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    purchase_invoice_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    item_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    item_batch_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    free_quantity: Mapped[int] = mapped_column(Integer, default=0)
    rate: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    line_total: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
