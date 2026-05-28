from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.inventory import Item, ItemBatch
from app.schemas.inventory import ItemCreate, BatchCreate

router = APIRouter()


@router.post("/items")
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    item = Item(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("/items")
def list_items(company_id: str, branch_id: str, db: Session = Depends(get_db)):
    return (
        db.query(Item)
        .filter(
            Item.company_id == company_id,
            Item.branch_id == branch_id,
            Item.is_deleted.is_(False),
        )
        .order_by(Item.name.asc())
        .all()
    )


@router.post("/batches")
def create_batch(payload: BatchCreate, db: Session = Depends(get_db)):
    batch = ItemBatch(**payload.model_dump())
    db.add(batch)
    db.commit()
    db.refresh(batch)
    return batch


@router.get("/alerts/near-expiry")
def near_expiry(company_id: str, branch_id: str, days: int = 60, db: Session = Depends(get_db)):
    threshold = date.today() + timedelta(days=days)
    return (
        db.query(ItemBatch)
        .filter(
            ItemBatch.company_id == company_id,
            ItemBatch.branch_id == branch_id,
            ItemBatch.expiry_date <= threshold,
            ItemBatch.is_deleted.is_(False),
        )
        .order_by(ItemBatch.expiry_date.asc())
        .all()
    )
