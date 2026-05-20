import os
import json
import time
import psycopg2
from datetime import datetime, timedelta
from fastapi import APIRouter
from langchain.agents import AgentExecutor, create_react_agent
from langchain_core.tools import tool
from langchain_core.prompts import PromptTemplate

from services.llm_service import llm_agent

router = APIRouter()
DB_URL = os.getenv("DATABASE_URL")


# =============================================================================
# LangChain Tools
# =============================================================================

@tool
def get_item_stock(item_name: str) -> str:
    """Get current stock level and reorder point for an item by name."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        'SELECT stock_qty, "reorderPoint", expiry, unit, company '
        'FROM "Items" WHERE name ILIKE %s LIMIT 1',
        (f"%{item_name}%",),
    )
    row = cur.fetchone()
    conn.close()
    if row:
        return (
            f"Stock: {row[0]} {row[3]}, ReorderPoint: {row[1]}, "
            f"Expiry: {row[2]}, Company: {row[4]}"
        )
    return "Item not found in database."


@tool
def get_purchase_velocity(item_name: str) -> str:
    """Calculate average daily purchase quantity for an item over the last 90 days."""
    conn  = psycopg2.connect(DB_URL)
    cur   = conn.cursor()
    since = datetime.now() - timedelta(days=90)
    cur.execute(
        'SELECT items FROM "PurchaseOrders" '
        'WHERE "createdAt" >= %s AND status = %s',
        (since, "received"),
    )
    orders = cur.fetchall()
    conn.close()

    total = 0
    for (items_json,) in orders:
        for item in (items_json or []):
            if item_name.lower() in item.get("name", "").lower():
                total += item.get("qty", 0)

    avg_daily = round(total / 90, 2)
    reorder_q = round(avg_daily * 30, 0)
    safety    = round(avg_daily * 3, 0)

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
        'SELECT "supplierName", "supplierId", "createdAt" '
        'FROM "PurchaseOrders" '
        'WHERE status = %s AND items::text ILIKE %s '
        'ORDER BY "createdAt" DESC LIMIT 1',
        ("received", f"%{item_name}%"),
    )
    row = cur.fetchone()
    conn.close()
    if row:
        return f"Last supplier: {row[0]} (ID:{row[1]}) on {row[2].date()}"
    return "No purchase history found. Use supplierId=1 as default."


@tool
def create_draft_purchase_order(order_json: str) -> str:
    """
    Create a draft AI-generated purchase order.
    Input must be JSON with keys: itemName, qty, supplierId, supplierName, reason
    """
    try:
        data          = json.loads(order_json)
        item_name     = data["itemName"]
        qty           = int(data.get("qty", 1))
        supplier_id   = int(data.get("supplierId", 1))
        supplier_name = data.get("supplierName", "Auto-Reorder")
        reason        = data.get("reason", "AI Reorder Agent")
        po_number     = f"AI-PO-{int(time.time())}"

        conn = psycopg2.connect(DB_URL)
        cur  = conn.cursor()
        cur.execute(
            'INSERT INTO "PurchaseOrders" '
            '("poNumber","supplierId","supplierName","items","subtotal","gstAmount",'
            '"discount","total","amountPaid","balanceDue","paymentMode","status",'
            '"notes","createdAt","updatedAt") '
            "VALUES (%s,%s,%s,%s,0,0,0,0,0,0,'credit','pending',%s,NOW(),NOW()) "
            "RETURNING id",
            (
                po_number,
                supplier_id,
                supplier_name,
                json.dumps([{"name": item_name, "qty": qty}]),
                f"AI Agent: {reason}",
            ),
        )
        po_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return f"Draft PO #{po_number} (id:{po_id}) created - {qty}x {item_name} from {supplier_name}"
    except Exception as e:
        return f"Failed to create PO: {e}"


# =============================================================================
# ReAct Agent
# =============================================================================

TOOLS = [
    get_item_stock,
    get_purchase_velocity,
    get_supplier_for_item,
    create_draft_purchase_order,
]

REACT_TEMPLATE = """You are an autonomous Inventory Reorder Agent for a medical store ERP.
Your job is to decide whether to reorder an item and how much to order.

Tools available:
{tools}

Tool names: {tool_names}

Format to follow strictly:
Question: the input question
Thought: think step by step
Action: tool name (one of [{tool_names}])
Action Input: input to the tool
Observation: result of the tool
... (repeat as needed)
Thought: I now have enough information
Final Answer: your conclusion

Begin!
Question: {input}
Thought:{agent_scratchpad}"""


async def run_reorder_for_item(item_name: str, stock: int, reorder_point: int) -> dict:
    prompt   = PromptTemplate.from_template(REACT_TEMPLATE)
    agent    = create_react_agent(llm_agent, TOOLS, prompt)
    executor = AgentExecutor(
        agent=agent,
        tools=TOOLS,
        verbose=True,
        max_iterations=8,
        handle_parsing_errors=True,
    )
    result = await executor.ainvoke({
        "input": (
            f'Item: "{item_name}" has {stock} units (reorder point: {reorder_point}).\n'
            f"1. Confirm current stock.\n"
            f"2. Get 90-day purchase velocity.\n"
            f"3. Find the last supplier.\n"
            f"4. If stock <= reorder point, create a draft PO for a 30-day supply.\n"
            f"5. Summarise what you did."
        )
    })
    return {"item": item_name, "agent_output": result.get("output", "")}


# =============================================================================
# Endpoints
# =============================================================================

@router.get("/suggestions")
def get_suggestions():
    """Return all items at or below their reorder point."""
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()
    cur.execute(
        'SELECT id, name, stock_qty, "reorderPoint", category, unit, expiry '
        'FROM "Items" '
        'WHERE stock_qty <= "reorderPoint" '
        'ORDER BY (stock_qty - "reorderPoint") ASC'
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id":           r[0],
            "name":         r[1],
            "stock_qty":    r[2],
            "reorderPoint": r[3],
            "category":     r[4],
            "unit":         r[5],
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
        'SELECT name, stock_qty, "reorderPoint" '
        'FROM "Items" '
        'WHERE stock_qty <= "reorderPoint" '
        'LIMIT 10'
    )
    items = cur.fetchall()
    conn.close()

    if not items:
        return {"message": "All items are sufficiently stocked. No reorders needed."}

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
        'SELECT id, "poNumber", "supplierName", items, notes, "createdAt" '
        'FROM "PurchaseOrders" '
        "WHERE status = 'pending' AND \"poNumber\" LIKE 'AI-PO-%' "
        'ORDER BY "createdAt" DESC'
    )
    rows = cur.fetchall()
    conn.close()
    return [
        {
            "id":           r[0],
            "poNumber":     r[1],
            "supplierName": r[2],
            "items":        r[3],
            "notes":        r[4],
            "createdAt":    str(r[5]),
        }
        for r in rows
    ]
