from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.tenant import Company
from app.schemas.company import CompanyCreate

router = APIRouter()


@router.post("")
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    company = Company(**payload.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("")
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).filter(Company.is_deleted.is_(False)).order_by(Company.created_at.desc()).all()
