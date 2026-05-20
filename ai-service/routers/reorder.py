"""
Reorder Agent
GET  /ai/reorder/suggestions        — list items below reorder point + AI analysis
POST /ai/reorder/run-agent          — run LangChain ReAct agent → auto draft POs
GET  /ai/reorder/draft-orders       — list AI-generated draft POs
"""
import os, json, time, psycopg2
from datetime import datetime, timedelta
from fastapi import APIRouter
from langchain.agents import create_react_agent, AgentExecutor
from langchain_core.tools import tool
from langchain_core.prompts import PromptTemplate

from services.llm_service import llm_agent

router  = APIRouter()
DB_URL  = os.getenv("DATABASE_URL")


# ═══════════════════════════════════════════════════════════════════════════════
# Tools available to the ReAct agent
# ═══════════════════════════════════════════════════════════════════════════════

@tool
def get_item_stock(item_name: str) -> str:
    """Get current stock level and reorder point for an item by name."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT stock_qty, "reorderPoint", expiry, unit, company
           FROM "Items" WHERE name ILIKE %s LIMIT 1""",
        (f"%{item_name}%",),
    )
    row = cur.fetchone(); conn.close()
    if row:
        return (f"Stock: {row[0]} {row[3]}, ReorderPoint: {row[1]}, "
                f"Expiry: {row[2]}, Company: {row[4]}")
    return "Item not found in database."


@tool
def get_purchase_velocity(item_name: str) -> str:
    """
    Calculate average daily purchase quantity for an item over the last 90 days.
    Returns total purchased and average daily velocity.
    """
    conn  = psycopg2.connect(DB_URL)
    cur   = conn.cursor()
    since = datetime.now() - timedelta(days=90)
    cur.execute(
        """SELECT items FROM "PurchaseOrders"
           WHERE "createdAt" >= %s AND status = 'received'""",
        (since,),
    )
    orders = cur.fetchall(); conn.close()

    total = 0
    for (items_json,) in orders:
        for item in (items_json or []):
            if item_name.lower() in item.get("name", "").lower():
                total += item.get("qty", 0)

    avg_daily = round(total / 90, 2)
    lead_days = 3   # assumed supplier lead time
    safety    = round(avg_daily * lead_days, 0)
    reorder_q = round(avg_daily * 30, 0)   # 30-day supply

    return (
        f"90-day total purchased: {total} units. "
        f"Avg daily: {avg_daily}/day. "
        f"Safety stock: {safety} units. "
        f"Suggested reorder qty (30-day supply): {int(reorder_q)} units."
    )


@tool
def get_supplier_for_item(item_name: str) -> str:
    """Find the most recent supplier who supplied this item."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT "supplierName", "supplierId", "createdAt"
           FROM   "PurchaseOrders"
           WHERE  status = 'received'
             AND  items::text ILIKE %s
           ORDER  BY "createdAt" DESC LIMIT 1""",
        (f"%{item_name}%",),
    )
    row = cur.fetchone(); conn.close()
    if row:
        return f"Last supplier: {row[0]} (ID:{row[1]}) on {row[2].date()}"
    return "No purchase history found for this item. Use supplierId=1 as default."


@tool
def create_draft_purchase_order(order_json: str) -> str:
    """
    Create a draft AI-generated purchase order.
    Input must be JSON: {"itemName": str, "qty": int, "supplierId": int,
                          "supplierName": str, "reason": str}
    """
    try:
        data         = json.loads(order_json)
        item_name    = data["itemName"]
        qty          = int(data.get("qty", 1))
        supplier_id  = int(data.get("supplierId", 1))
        supplier_name= data.get("supplierName", "Auto-Reorder")
        reason       = data.get("reason", "AI Reorder Agent")
        po_number    = f"AI-PO-{int(time.time())}"

        conn = psycopg2.connect(DB_URL)
        cur  = conn.cursor()
        cur.execute(
            """INSERT INTO "PurchaseOrders"
               ("poNumber","supplierId","supplierName","items","subtotal","gstAmount",
                "discount","total","amountPaid","balanceDue","paymentMode","status",
                "notes","createdAt","updatedAt")
               VALUES (%s,%s,%s,%s,0,0,0,0,0,0,'credit','pending',%s,NOW(),NOW())
               RETURNING id""",
            (po_number, supplier_id, supplier_name,
             json.dumps([{"name": item_name, "qty": qty}]),
             f"🤖 AI Agent: {reason}"),
        )
        po_id = cur.fetchone()[0]
        conn.commit(); conn.close()
        return f"✅ Draft PO #{po_number} (id:{po_id}) created — {qty}x {item_name} from {supplier_name}"
    except Exception as e:
        return f"❌ Failed to create PO: {e}"


# ═══════════════════════════════════════════════════════════════════════════════
# ReAct Agent setup
# ═══════════════════════════════════════════════════════════════════════════════

TOOLS = [get_item_stock, get_purchase_velocity, get_supplier_for_item, create_draft_purchase_order]

REACT_PROMPT = PromptTemplate.from_template("""You are an autonomous Inventory Reorder Agent for a medical store ERP system.
Your job is to decide whether to reorder an item and how much to order.

You have access to these tools:
{tools}

Tool names: {tool_names}

Reasoning format (strictly follow):
Question: the input question you must answer
Thought: think step by step
Action: the tool to use (one of [{tool_names}])
Action Input: the input to the tool
Observation: the result of the tool
... (repeat Thought/Action/Observation as needed)
Thought: I now have enough information
Final Answer: Your conclusion with action taken

Begin!

Question: {input}
Thought:{agent_scratchpad}""")


async def run_reorder_for_item(item_name: str, stock: int, reorder_point: int) -> dict:
    agent    = create_react_agent(llm_agent, TOOLS, REACT_PROMPT)
    executor = AgentExecutor(
        agent=agent, tools=TOOLS,
        verbose=True, max_iterations=8,
        handle_parsing_errors=True,
    )
    result = await executor.ainvoke({
        "input": (
            f'Item: "{item_name}" has {stock} units in stock (reorder point: {reorder_point}).\n'
            f"1. Confirm current stock.\n"
            f"2. Get the 90-day purchase velocity.\n"
            f"3. Find the last supplier for this item.\n"
            f"4. If stock <= reorder point, create a draft PO for a 30-day supply.\n"
            f"5. Give a brief summary of what you did."
        )
    })
    return {"item": item_name, "agent_output": result.get("output", "")}


# ═══════════════════════════════════════════════════════════════════════════════
# Endpoints
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/suggestions")
def get_suggestions():
    """Return all items currently at or below their reorder point."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT id, name, stock_qty, "reorderPoint", category, unit, expiry
           FROM "Items"
           WHERE stock_qty <= "reorderPoint"
           ORDER BY (stock_qty - "reorderPoint") ASC"""
    )
    rows = cur.fetchall(); conn.close()

    return [
        {
            "id":           r[0], "name":         r[1],
            "stock_qty":    r[2], "reorderPoint":  r[3],
            "category":     r[4], "unit":           r[5],
            "expiry":       str(r[6]) if r[6] else None,
            "deficit":      r[3] - r[2],
        }
        for r in rows
    ]


@router.post("/run-agent")
async def run_agent():
    """Run the LangChain ReAct reorder agent for all low-stock items."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT name, stock_qty, "reorderPoint"
           FROM "Items"
           WHERE stock_qty <= "reorderPoint"
           LIMIT 10"""          # cap at 10 per run to avoid timeout
    )
    items = cur.fetchall(); conn.close()

    if not items:
        return {"message": "✅ All items are sufficiently stocked. No reorders needed."}

    results = []
    for (name, stock, rp) in items:
        r = await run_reorder_for_item(name, stock, rp)
        results.append(r)

    return {"processed": len(results), "results": results}


@router.get("/draft-orders")
def get_draft_orders():
    """Return all AI-generated draft purchase orders."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        """SELECT id, "poNumber", "supplierName", items, notes, "createdAt"
           FROM "PurchaseOrders"
           WHERE status = 'pending' AND "poNumber" LIKE 'AI-PO-%'
           ORDER BY "createdAt" DESC"""
    )
    rows = cur.fetchall(); conn.close()
    return [
        {
            "id":           r[0], "poNumber":     r[1],
            "supplierName": r[2], "items":         r[3],
            "notes":        r[4], "createdAt":     str(r[5]),
        }
        for r in rows
    ]
