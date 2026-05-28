import uuid
from datetime import date
from sqlalchemy import String, Date, Numeric, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin


class Item(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "items"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sku: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    hsn_code: Mapped[str] = mapped_column(String(16), nullable=True)
    gst_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=0, nullable=False)
    reorder_level: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    rack_code: Mapped[str] = mapped_column(String(40), nullable=True)


class ItemBatch(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "item_batches"
    __table_args__ = (
        Index("ix_item_batches_expiry", "expiry_date"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    batch_no: Mapped[str] = mapped_column(String(60), nullable=False)
    expiry_date: Mapped[date] = mapped_column(Date, nullable=False)
    mrp: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    purchase_rate: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
