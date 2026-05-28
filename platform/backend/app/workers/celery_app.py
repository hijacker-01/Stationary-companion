from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "marg_next_erp",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.task_routes = {
    "app.workers.tasks.ocr.extract_invoice": {"queue": "ocr"},
    "app.workers.tasks.forecasting.run_demand_forecast": {"queue": "forecast"},
    "app.workers.tasks.anomaly.detect_anomaly": {"queue": "anomaly"},
    "app.workers.tasks.recommendation.compute_reorder_recommendations": {"queue": "recommendation"},
}
