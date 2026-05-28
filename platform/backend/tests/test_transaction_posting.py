from datetime import date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models.base import Base
from app.models.accounting import LedgerAccount, CompanyLedgerConfig, JournalLine
from app.models.inventory import ItemBatch
from app.schemas.transaction import PurchaseCreate, PurchaseLineIn, SalesCreate, SalesLineIn
from app.services.purchase_posting_service import create_purchase_invoice
from app.services.sales_posting_service import create_sales_invoice


def setup_db():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    return Session()


def seed_ledgers(db, company_id, branch_id):
    keys = [
        ("inventory", "L-INV"),
        ("supplier_control", "L-SUP"),
        ("gst_input", "L-GST-IN"),
        ("customer_control", "L-CUS"),
        ("sales", "L-SAL"),
        ("gst_output", "L-GST-OUT"),
    ]
    for key, code in keys:
        ledger = LedgerAccount(company_id=company_id, branch_id=branch_id, code=code, name=code, group_name="auto")
        db.add(ledger)
        db.flush()
        db.add(CompanyLedgerConfig(company_id=company_id, branch_id=branch_id, key=key, ledger_account_id=ledger.id))


def test_purchase_posting_creates_double_entry_and_stock_increase():
    db = setup_db()
    company_id = "c1"
    branch_id = "b1"
    seed_ledgers(db, company_id, branch_id)
    batch = ItemBatch(
        company_id=company_id,
        branch_id=branch_id,
        item_id="i1",
        batch_no="B1",
        expiry_date=date(2027, 1, 1),
        mrp=100,
        purchase_rate=50,
        quantity=10,
    )
    db.add(batch)
    db.commit()

    payload = PurchaseCreate(
        company_id=company_id,
        branch_id=branch_id,
        supplier_id="s1",
        invoice_no="P-1",
        invoice_date=date(2026, 5, 28),
        discount_amount=0,
        lines=[PurchaseLineIn(item_id="i1", item_batch_id=batch.id, quantity=5, free_quantity=1, rate=40, gst_rate=12)],
    )

    with db.begin():
        invoice = create_purchase_invoice(db, payload)

    db.refresh(batch)
    assert batch.quantity == 16
    assert float(invoice.total_amount) == 224.0

    lines = db.query(JournalLine).all()
    total_debit = sum(float(l.debit) for l in lines)
    total_credit = sum(float(l.credit) for l in lines)
    assert round(total_debit, 2) == round(total_credit, 2)


def test_sales_rolls_back_on_insufficient_stock():
    db = setup_db()
    company_id = "c1"
    branch_id = "b1"
    seed_ledgers(db, company_id, branch_id)
    batch = ItemBatch(
        company_id=company_id,
        branch_id=branch_id,
        item_id="i1",
        batch_no="B2",
        expiry_date=date(2027, 1, 1),
        mrp=100,
        purchase_rate=50,
        quantity=2,
    )
    db.add(batch)
    db.commit()

    payload = SalesCreate(
        company_id=company_id,
        branch_id=branch_id,
        customer_id="c001",
        invoice_no="S-1",
        invoice_date=date(2026, 5, 28),
        discount_amount=0,
        payment_status="paid",
        lines=[SalesLineIn(item_id="i1", item_batch_id=batch.id, quantity=3, free_quantity=0, rate=60, gst_rate=12)],
    )

    failed = False
    try:
        with db.begin():
            create_sales_invoice(db, payload)
    except Exception:
        failed = True
    assert failed

    db.refresh(batch)
    assert batch.quantity == 2
