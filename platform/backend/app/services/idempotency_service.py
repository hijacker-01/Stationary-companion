from sqlalchemy.orm import Session
from app.models.idempotency import IdempotencyKey


def get_existing_response(db: Session, company_id: str, branch_id: str, scope: str, key: str):
    row = (
        db.query(IdempotencyKey)
        .filter(
            IdempotencyKey.company_id == company_id,
            IdempotencyKey.branch_id == branch_id,
            IdempotencyKey.scope == scope,
            IdempotencyKey.key == key,
        )
        .first()
    )
    if row:
        return row.response_payload
    return None


def save_response(db: Session, company_id: str, branch_id: str, scope: str, key: str, payload: dict):
    row = IdempotencyKey(
        company_id=company_id,
        branch_id=branch_id,
        scope=scope,
        key=key,
        response_payload=payload,
    )
    db.add(row)
