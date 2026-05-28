from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.analytics_service import get_kpi_summary

router = APIRouter()


@router.get("/kpis")
def kpis(company_id: str, branch_id: str, db: Session = Depends(get_db)):
    return get_kpi_summary(db, company_id, branch_id)
