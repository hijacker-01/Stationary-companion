from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.accounting import LedgerAccount, CompanyLedgerConfig

router = APIRouter()


@router.post("/seed-default-ledgers")
def seed_default_ledgers(company_id: str, branch_id: str, db: Session = Depends(get_db)):
    defaults = [
        ("inventory", "L-INV", "Inventory", "Assets"),
        ("supplier_control", "L-SUP", "Supplier Control", "Liability"),
        ("gst_input", "L-GST-IN", "Input GST", "Assets"),
        ("customer_control", "L-CUS", "Customer Control", "Assets"),
        ("sales", "L-SAL", "Sales", "Income"),
        ("gst_output", "L-GST-OUT", "Output GST", "Liability"),
    ]

    created = []
    with db.begin():
        for key, code, name, group_name in defaults:
            ledger = (
                db.query(LedgerAccount)
                .filter(
                    LedgerAccount.company_id == company_id,
                    LedgerAccount.branch_id == branch_id,
                    LedgerAccount.code == code,
                    LedgerAccount.is_deleted.is_(False),
                )
                .first()
            )
            if not ledger:
                ledger = LedgerAccount(
                    company_id=company_id,
                    branch_id=branch_id,
                    code=code,
                    name=name,
                    group_name=group_name,
                )
                db.add(ledger)
                db.flush()
            cfg = (
                db.query(CompanyLedgerConfig)
                .filter(
                    CompanyLedgerConfig.company_id == company_id,
                    CompanyLedgerConfig.branch_id == branch_id,
                    CompanyLedgerConfig.key == key,
                    CompanyLedgerConfig.is_deleted.is_(False),
                )
                .first()
            )
            if not cfg:
                cfg = CompanyLedgerConfig(
                    company_id=company_id,
                    branch_id=branch_id,
                    key=key,
                    ledger_account_id=ledger.id,
                )
                db.add(cfg)
            created.append({"key": key, "ledger_id": ledger.id})
    return {"created": created}
