import uuid
from sqlalchemy import String, Integer, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, TenantScopedMixin


class StockMovement(Base, TimestampMixin, TenantScopedMixin):
    __tablename__ = "stock_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    item_batch_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    movement_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    reference_type: Mapped[str] = mapped_column(String(50), index=True, nullable=False)
    reference_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    rate: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    expires_at: Mapped[DateTime | None] = mapped_column(DateTime, nullable=True)
