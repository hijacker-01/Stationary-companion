from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    companies,
    inventory,
    health,
    transactions,
    ledger_admin,
    query_transactions,
    analytics,
    ai_ops,
    rag,
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(query_transactions.router, prefix="/queries", tags=["queries"])
api_router.include_router(ledger_admin.router, prefix="/ledger-admin", tags=["ledger-admin"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(ai_ops.router, prefix="/ai-ops", tags=["ai-ops"])
api_router.include_router(rag.router, prefix="/rag", tags=["rag"])
