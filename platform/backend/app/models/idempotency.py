import uuid
from sqlalchemy import String, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, TenantScopedMixin


class IdempotencyKey(Base, TimestampMixin, TenantScopedMixin):
    __tablename__ = "idempotency_keys"
    __table_args__ = (
        UniqueConstraint("company_id", "branch_id", "scope", "key", name="uq_idempotency_scope_key"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scope: Mapped[str] = mapped_column(String(50), nullable=False)
    key: Mapped[str] = mapped_column(String(120), nullable=False)
    response_payload: Mapped[dict] = mapped_column(JSON, default=dict)
