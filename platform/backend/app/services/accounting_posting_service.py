from sqlalchemy.orm import Session
from app.models.accounting import JournalEntry, JournalLine


def post_purchase_journal(
    db: Session,
    company_id: str,
    branch_id: str,
    voucher_no: str,
    posting_date,
    inventory_ledger_id: str,
    supplier_ledger_id: str,
    gst_input_ledger_id: str,
    taxable_amount: float,
    gst_amount: float,
    total_amount: float,
):
    entry = JournalEntry(
        company_id=company_id,
        branch_id=branch_id,
        voucher_no=voucher_no,
        posting_date=posting_date,
        narration="Purchase invoice posting",
    )
    db.add(entry)
    db.flush()

    db.add_all([
        JournalLine(journal_entry_id=entry.id, ledger_account_id=inventory_ledger_id, debit=taxable_amount, credit=0),
        JournalLine(journal_entry_id=entry.id, ledger_account_id=gst_input_ledger_id, debit=gst_amount, credit=0),
        JournalLine(journal_entry_id=entry.id, ledger_account_id=supplier_ledger_id, debit=0, credit=total_amount),
    ])


def post_sales_journal(
    db: Session,
    company_id: str,
    branch_id: str,
    voucher_no: str,
    posting_date,
    customer_ledger_id: str,
    sales_ledger_id: str,
    gst_output_ledger_id: str,
    taxable_amount: float,
    gst_amount: float,
    total_amount: float,
):
    entry = JournalEntry(
        company_id=company_id,
        branch_id=branch_id,
        voucher_no=voucher_no,
        posting_date=posting_date,
        narration="Sales invoice posting",
    )
    db.add(entry)
    db.flush()

    db.add_all([
        JournalLine(journal_entry_id=entry.id, ledger_account_id=customer_ledger_id, debit=total_amount, credit=0),
        JournalLine(journal_entry_id=entry.id, ledger_account_id=sales_ledger_id, debit=0, credit=taxable_amount),
        JournalLine(journal_entry_id=entry.id, ledger_account_id=gst_output_ledger_id, debit=0, credit=gst_amount),
    ])
