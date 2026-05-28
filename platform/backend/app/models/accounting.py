import uuid
from sqlalchemy import String, Date, Numeric, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin


class LedgerAccount(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "ledger_accounts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code: Mapped[str] = mapped_column(String(40), index=True, nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    group_name: Mapped[str] = mapped_column(String(80), nullable=False)


class CompanyLedgerConfig(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "company_ledger_configs"
    __table_args__ = (
        UniqueConstraint("company_id", "branch_id", "key", name="uq_company_ledger_config"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key: Mapped[str] = mapped_column(String(40), nullable=False, index=True)
    ledger_account_id: Mapped[str] = mapped_column(ForeignKey("ledger_accounts.id"), nullable=False, index=True)


class JournalEntry(Base, TimestampMixin, SoftDeleteMixin, TenantScopedMixin):
    __tablename__ = "journal_entries"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    voucher_no: Mapped[str] = mapped_column(String(64), index=True, nullable=False)
    posting_date: Mapped[Date] = mapped_column(Date, nullable=False)
    narration: Mapped[str] = mapped_column(String(512), default="")


class JournalLine(Base, TimestampMixin):
    __tablename__ = "journal_lines"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    journal_entry_id: Mapped[str] = mapped_column(ForeignKey("journal_entries.id"), index=True)
    ledger_account_id: Mapped[str] = mapped_column(ForeignKey("ledger_accounts.id"), index=True)
    debit: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
    credit: Mapped[float] = mapped_column(Numeric(14, 2), default=0)
