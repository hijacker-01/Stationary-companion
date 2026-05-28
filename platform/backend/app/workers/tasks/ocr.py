from app.workers.celery_app import celery_app


@celery_app.task(name="app.workers.tasks.ocr.extract_invoice")
def extract_invoice(file_uri: str):
    return {
        "file_uri": file_uri,
        "status": "queued_for_ocr",
        "confidence": 0.0,
        "extracted": {},
    }
