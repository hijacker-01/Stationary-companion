import uuid
from sqlalchemy import String, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin


class Supplier(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "suppliers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(String(15), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)


class Customer(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "customers"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    gstin: Mapped[str] = mapped_column(String(15), nullable=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    credit_limit: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    outstanding_amount: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
