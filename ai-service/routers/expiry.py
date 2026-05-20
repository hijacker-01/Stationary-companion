"""
Expiry Protection Router
GET  /ai/expiry/risks          — all items expiring soon with risk score + AI action
POST /ai/expiry/suggest/:id    — LLM suggests action for a specific item
POST /ai/expiry/run-agent      — run full expiry protection sweep
"""
import os, psycopg2
from datetime import datetime, date, timedelta
from fastapi import APIRouter, HTTPException
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from services.llm_service import llm

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL")

# Risk tiers
RISK_CONFIG = [
    {"label": "CRITICAL",  "days": 7,  "color": "#ef4444", "discount": 40},
    {"label": "HIGH",      "days": 15, "color": "#f97316", "discount": 25},
    {"label": "MEDIUM",    "days": 30, "color": "#eab308", "discount": 10},
    {"label": "LOW",       "days": 60, "color": "#3b82f6", "discount": 5},
    {"label": "WATCH",     "days": 90, "color": "#8b5cf6", "discount": 0},
]

# ── LLM Action Prompt ─────────────────────────────────────────────────────────
ACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are an inventory expiry management expert for an Indian medical/pharma store.
Given an item that is expiring soon, suggest the best action.

Return ONLY valid JSON:
{{
  "action": "one of: DISCOUNT | RETURN_TO_SUPPLIER | TRANSFER | URGENT_SELL | DISPOSE",
  "discount_percent": number (0 if action is not DISCOUNT),
  "reason": "brief explanation in 1 sentence",
  "urgency": "HIGH | MEDIUM | LOW",
  "fifo_note": "brief FIFO/FEFO guidance for this item"
}}"""),
    ("human", """Item: {item_name}
Category: {category}
Current Stock: {stock_qty} {unit}
Expiry Date: {expiry}
Days Until Expiry: {days_left}
MRP: ₹{mrp}
Cost Price: ₹{cost_price}"""),
])


def _days_left(expiry_date) -> int:
    if not expiry_date:
        return 9999
    if isinstance(expiry_date, str):
        try:
            expiry_date = date.fromisoformat(expiry_date)
        except Exception:
            return 9999
    return (expiry_date - date.today()).days


def _get_risk_tier(days: int) -> dict:
    for tier in RISK_CONFIG:
        if days <= tier["days"]:
            return tier
    return {"label": "SAFE", "days": 999, "color": "#22c55e", "discount": 0}


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/risks")
def get_expiry_risks():
    """Return all items expiring within 90 days, sorted by urgency."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cutoff = date.today() + timedelta(days=90)
    cur.execute(
        """SELECT id, name, batch, category, stock_qty, unit, expiry, mrp, cost_price
           FROM "Items"
           WHERE expiry IS NOT NULL
             AND expiry <= %s
             AND stock_qty > 0
           ORDER BY expiry ASC""",
        (cutoff,),
    )
    rows = cur.fetchall(); conn.close()

    result = []
    for r in rows:
        days = _days_left(r[6])
        tier = _get_risk_tier(days)
        result.append({
            "id":              r[0],
            "name":            r[1],
            "batch":           r[2],
            "category":        r[3],
            "stock_qty":       r[4],
            "unit":            r[5],
            "expiry":          str(r[6]),
            "mrp":             r[7],
            "cost_price":      r[8],
            "days_left":       days,
            "risk_label":      tier["label"],
            "risk_color":      tier["color"],
            "suggested_discount": tier["discount"],
        })
    return result


@router.post("/suggest/{item_id}")
async def suggest_action(item_id: int):
    """Run LLM to generate a smart expiry action for one specific item."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT name, category, stock_qty, unit, expiry, mrp, cost_price
           FROM "Items" WHERE id = %s""",
        (item_id,),
    )
    row = cur.fetchone(); conn.close()
    if not row:
        raise HTTPException(404, "Item not found")

    days = _days_left(row[4])
    chain    = ACTION_PROMPT | llm | JsonOutputParser()
    suggestion = await chain.ainvoke({
        "item_name":  row[0],
        "category":   row[1] or "General",
        "stock_qty":  row[2],
        "unit":       row[3] or "units",
        "expiry":     str(row[4]),
        "days_left":  days,
        "mrp":        row[5] or 0,
        "cost_price": row[6] or 0,
    })

    return {
        "item_id":   item_id,
        "item_name": row[0],
        "days_left": days,
        **suggestion,
    }


@router.post("/run-agent")
async def run_expiry_agent():
    """
    Full expiry sweep:
    • Returns CRITICAL + HIGH risk items with LLM-generated actions.
    • Called nightly by the scheduler.
    """
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cutoff = date.today() + timedelta(days=15)   # only CRITICAL + HIGH
    cur.execute(
        """SELECT id, name, category, stock_qty, unit, expiry, mrp, cost_price
           FROM "Items"
           WHERE expiry IS NOT NULL AND expiry <= %s AND stock_qty > 0
           ORDER BY expiry ASC LIMIT 20""",
        (cutoff,),
    )
    rows = cur.fetchall(); conn.close()

    if not rows:
        return {"message": "✅ No critical or high-risk expiry items found."}

    chain   = ACTION_PROMPT | llm | JsonOutputParser()
    actions = []
    for r in rows:
        days = _days_left(r[5])
        try:
            suggestion = await chain.ainvoke({
                "item_name":  r[1], "category":   r[2] or "General",
                "stock_qty":  r[3], "unit":        r[4] or "units",
                "expiry":     str(r[5]), "days_left": days,
                "mrp":        r[6] or 0, "cost_price": r[7] or 0,
            })
            actions.append({"item_id": r[0], "item_name": r[1],
                            "days_left": days, **suggestion})
        except Exception as e:
            actions.append({"item_id": r[0], "item_name": r[1],
                            "days_left": days, "error": str(e)})

    return {"processed": len(actions), "actions": actions}
