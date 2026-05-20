import asyncio
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

scheduler = BackgroundScheduler(timezone="Asia/Kolkata")


def _run_async(coro):
    """Run an async coroutine from a sync APScheduler job."""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


def job_reorder_sweep():
    print("[Scheduler] Running nightly Reorder Agent sweep...")
    from routers.reorder import run_agent
    _run_async(run_agent())


def job_expiry_sweep():
    print("[Scheduler] Running morning Expiry Protection sweep...")
    from routers.expiry import run_expiry_agent
    _run_async(run_expiry_agent())


def job_rag_sync():
    print("[Scheduler] Refreshing RAG knowledge base from DB...")
    from services.rag_service import sync_products_from_db
    count = sync_products_from_db()
    print(f"RAG refreshed - {count} products embedded")


def start_scheduler():
    scheduler.add_job(job_reorder_sweep, CronTrigger(hour=23, minute=0), id="reorder_sweep")
    scheduler.add_job(job_expiry_sweep,  CronTrigger(hour=8,  minute=0), id="expiry_sweep")
    scheduler.add_job(job_rag_sync,      CronTrigger(hour=0,  minute=0), id="rag_sync")
    scheduler.start()
    print("Scheduler started (reorder@23:00, expiry@08:00, rag-sync@00:00 IST)")
