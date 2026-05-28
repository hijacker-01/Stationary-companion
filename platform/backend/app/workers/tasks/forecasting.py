from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.forecasting.run_demand_forecast")
def run_demand_forecast(company_id: str, branch_id: str, item_id: str):
    return {
        "company_id": company_id,
        "branch_id": branch_id,
        "item_id": item_id,
        "horizon_days": 30,
        "predicted_units": [],
    }
