"""
Invoice Router
POST /ai/invoice/parse        — upload photo → structured JSON
POST /ai/invoice/sync-rag     — manually re-sync products to ChromaDB
"""
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from services.llm_service  import llm
from services.ocr_service  import extract_text_from_image
from services.rag_service  import find_best_product_match, sync_products_from_db

router = APIRouter()

# ── Prompt ────────────────────────────────────────────────────────────────────
INVOICE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an expert invoice parser for Indian medical/pharma stores.
Extract ALL line items from the OCR text of a purchase invoice.

Return ONLY valid JSON — no markdown, no explanation, just raw JSON.

Schema:
{{
  "supplierName": "string",
  "invoiceNo":    "string",
  "invoiceDate":  "YYYY-MM-DD or empty string",
  "items": [
    {{
      "name":        "string",
      "batch":       "string",
      "hsn":         "string",
      "pack":        "string",
      "qty":         number,
      "schemeQty":   number,
      "expiry":      "YYYY-MM-DD or empty string",
      "mrp":         number,
      "costPrice":   number,
      "taxPercent":  number
    }}
  ]
}}

Rules:
- expiry format MM/YY or MM/YYYY → convert to YYYY-MM-01
- If a field is missing, use 0 for numbers and "" for strings
- Skip any row that is a table header (e.g. "Product Name", "Qty", etc.)
- taxPercent = SGST% + CGST%"""),
    ("human", "OCR Text:\n{ocr_text}"),
])


# ── Parse endpoint ─────────────────────────────────────────────────────────────
@router.post("/parse")
async def parse_invoice(file: UploadFile = File(...)):
    """
    Upload an invoice photo → returns structured purchase data ready to save.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image (jpeg/png/webp)")

    image_bytes = await file.read()

    # ── Step 1: OCR ──────────────────────────────────────────────────────────
    try:
        ocr_text = extract_text_from_image(image_bytes)
    except Exception as e:
        raise HTTPException(500, f"OCR failed: {e}")

    if len(ocr_text.strip()) < 20:
        raise HTTPException(422, "Could not read text from image. Try a clearer photo.")

    # ── Step 2: LLM extraction ───────────────────────────────────────────────
    try:
        chain     = INVOICE_PROMPT | llm | JsonOutputParser()
        extracted = await chain.ainvoke({"ocr_text": ocr_text})
    except Exception as e:
        raise HTTPException(500, f"LLM parsing failed: {e}")

    # ── Step 3: RAG product-name correction ──────────────────────────────────
    for item in extracted.get("items", []):
        raw_name = item.get("name", "")
        if raw_name:
            match = find_best_product_match(raw_name)
            if match and match["score"] >= 0.72:
                item["name"]           = match["name"]
                item["rag_matched"]    = True
                item["rag_score"]      = match["score"]
            else:
                item["rag_matched"]    = False

    # ── Step 4: Compute totals ────────────────────────────────────────────────
    items     = extracted.get("items", [])
    subtotal  = sum(i.get("qty", 0) * i.get("costPrice", 0) for i in items)
    gst_amt   = sum(
        i.get("qty", 0) * i.get("costPrice", 0) * (i.get("taxPercent", 0) / 100)
        for i in items
    )

    return {
        **extracted,
        "subtotal":  round(subtotal,  2),
        "gstAmount": round(gst_amt,   2),
        "discount":  0,
        "total":     round(subtotal + gst_amt, 2),
        "ocr_text":  ocr_text,           # send back for debug panel
    }


# ── Manual RAG re-sync ────────────────────────────────────────────────────────
@router.post("/sync-rag")
def sync_rag():
    """Manually re-embed all Items from PostgreSQL into ChromaDB."""
    count = sync_products_from_db()
    return {"synced": count, "message": f"RAG updated with {count} products"}
