from datetime import datetime
from sqlalchemy import DateTime, Boolean, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )


class SoftDeleteMixin:
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class TenantScopedMixin:
    company_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
    branch_id: Mapped[str] = mapped_column(String(36), index=True, nullable=False)
