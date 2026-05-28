from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.accounting import CompanyLedgerConfig


REQUIRED_LEDGER_KEYS = {
    "inventory",
    "supplier_control",
    "gst_input",
    "customer_control",
    "sales",
    "gst_output",
}


def resolve_ledgers(db: Session, company_id: str, branch_id: str, required_keys: set[str]) -> dict[str, str]:
    configs = (
        db.query(CompanyLedgerConfig)
        .filter(
            CompanyLedgerConfig.company_id == company_id,
            CompanyLedgerConfig.branch_id == branch_id,
            CompanyLedgerConfig.key.in_(required_keys),
            CompanyLedgerConfig.is_deleted.is_(False),
        )
        .all()
    )
    mapping = {cfg.key: cfg.ledger_account_id for cfg in configs}

    missing = required_keys - set(mapping.keys())
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing company ledger mapping for: {', '.join(sorted(missing))}",
        )
    return mapping
