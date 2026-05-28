from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.anomaly.detect_anomaly")
def detect_anomaly(company_id: str, branch_id: str):
    return {
        "company_id": company_id,
        "branch_id": branch_id,
        "alerts": [],
    }
