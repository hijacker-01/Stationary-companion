import os
import psycopg2
from langchain_chroma import Chroma
from langchain_core.documents import Document
from services.llm_service import embeddings

CHROMA_DIR = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
DB_URL     = os.getenv("DATABASE_URL")

# ── Persistent ChromaDB vector store (saves to disk — no server needed) ───────
_vectorstore: Chroma | None = None

def get_vectorstore() -> Chroma:
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name="bpartner_products",
            embedding_function=embeddings,
            persist_directory=CHROMA_DIR,
        )
    return _vectorstore


# ── Sync PostgreSQL Items table → ChromaDB ────────────────────────────────────
def sync_products_from_db() -> int:
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, name, category, hsn, pack, "reorderPoint", company
        FROM   "Items"
        WHERE  name IS NOT NULL
    """)
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return 0

    docs = [
        Document(
            page_content=(
                f"{row[1]} "
                f"category:{row[2] or ''} "
                f"HSN:{row[3] or ''} "
                f"pack:{row[4] or ''} "
                f"company:{row[6] or ''}"
            ),
            metadata={
                "db_id":        row[0],
                "name":         row[1],
                "reorderPoint": row[5] or 10,
            },
        )
        for row in rows
    ]

    vs = get_vectorstore()
    # Use string IDs so upsert is idempotent
    ids = [f"item-{row[0]}" for row in rows]
    vs.add_documents(docs, ids=ids)
    return len(docs)


# ── Semantic product search ───────────────────────────────────────────────────
def find_best_product_match(ocr_name: str) -> dict | None:
    """Return the closest DB product name for a raw OCR string."""
    try:
        vs      = get_vectorstore()
        results = vs.similarity_search_with_score(ocr_name, k=1)
        if not results:
            return None
        doc, distance = results[0]
        score = max(0.0, 1.0 - distance)   # cosine distance → similarity
        return {
            "name":  doc.metadata.get("name", ocr_name),
            "score": round(score, 4),
            "db_id": doc.metadata.get("db_id"),
        }
    except Exception:
        return None


# ── Sync supplier purchase history ────────────────────────────────────────────
def sync_purchase_history() -> int:
    """Embed last-6-months PO notes into a separate RAG collection for context."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute("""
        SELECT id, "supplierName", items::text, notes
        FROM   "PurchaseOrders"
        WHERE  "createdAt" > NOW() - INTERVAL '6 months'
          AND  status = 'received'
    """)
    rows = cur.fetchall()
    conn.close()

    if not rows:
        return 0

    vs = Chroma(
        collection_name="bpartner_purchase_history",
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR,
    )
    docs = [
        Document(
            page_content=f"Supplier:{row[1]} Items:{row[2]} Notes:{row[3] or ''}",
            metadata={"po_id": row[0]},
        )
        for row in rows
    ]
    ids = [f"po-{row[0]}" for row in rows]
    vs.add_documents(docs, ids=ids)
    return len(docs)
