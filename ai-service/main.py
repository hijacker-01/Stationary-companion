import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

# ── Routers ──────────────────────────────────────────────────────────────────
from routers import invoice, reorder, expiry
from scheduler import start_scheduler

# ── Lifespan (startup / shutdown) ────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Bpartner AI Service starting…")
    print("📦 Syncing inventory to RAG knowledge base…")
    try:
        from services.rag_service import sync_products_from_db
        count = sync_products_from_db()
        print(f"✅ RAG synced {count} products from PostgreSQL → ChromaDB")
    except Exception as e:
        print(f"⚠️  RAG sync skipped (DB may not be ready yet): {e}")

    print("⏰ Starting background scheduler…")
    start_scheduler()
    print("✅ AI Service ready on http://localhost:8000")
    yield
    print("🛑 AI Service shutting down…")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Bpartner AI Service",
    description="LangChain + Ollama + ChromaDB RAG — Photo-to-ERP · Reorder · Expiry",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(invoice.router, prefix="/ai/invoice", tags=["Invoice AI"])
app.include_router(reorder.router, prefix="/ai/reorder", tags=["Reorder Agent"])
app.include_router(expiry.router,  prefix="/ai/expiry",  tags=["Expiry Protection"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "Bpartner AI", "version": "1.0.0"}
