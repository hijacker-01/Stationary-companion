from fastapi import APIRouter
from app.workers.tasks.ocr import extract_invoice
from app.workers.tasks.forecasting import run_demand_forecast
from app.workers.tasks.anomaly import detect_anomaly
from app.workers.tasks.recommendation import compute_reorder_recommendations

router = APIRouter()


@router.post("/ocr/extract")
def enqueue_ocr(file_uri: str):
    job = extract_invoice.delay(file_uri)
    return {"task_id": job.id}


@router.post("/forecast/run")
def enqueue_forecast(company_id: str, branch_id: str, item_id: str):
    job = run_demand_forecast.delay(company_id, branch_id, item_id)
    return {"task_id": job.id}


@router.post("/anomaly/run")
def enqueue_anomaly(company_id: str, branch_id: str):
    job = detect_anomaly.delay(company_id, branch_id)
    return {"task_id": job.id}


@router.post("/recommendation/run")
def enqueue_recommendation(company_id: str, branch_id: str):
    job = compute_reorder_recommendations.delay(company_id, branch_id)
    return {"task_id": job.id}
