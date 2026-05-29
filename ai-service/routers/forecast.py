from fastapi import APIRouter
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from db import get_db_connection
import json

router = APIRouter()
llm = Ollama(model="llama3")

@router.get("/items")
def forecast_demand():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Simple heuristic to get last 90 days of item sales (using Bill JSON data)
    cur.execute("""
        SELECT items
        FROM "Bills"
        WHERE "createdAt" >= NOW() - INTERVAL '90 days'
    """)
    
    bills = cur.fetchall()
    item_sales = {}
    for bill in bills:
        try:
            items_list = bill[0]
            if isinstance(items_list, str):
                items_list = json.loads(items_list)
            for item in items_list:
                name = item.get("name")
                qty = item.get("qty", 1)
                if name:
                    item_sales[name] = item_sales.get(name, 0) + int(qty)
        except Exception:
            continue
            
    cur.close()
    conn.close()
    
    if not item_sales:
        return {"status": "success", "data": "No sales data found for the last 90 days to generate forecast."}
    
    # Get top 5 selling items
    top_items = sorted(item_sales.items(), key=lambda x: x[1], reverse=True)[:5]
    sales_text = "\n".join([f"{name}: {qty} units sold" for name, qty in top_items])

    prompt = PromptTemplate(
        input_variables=["sales_data"],
        template="""
        You are a business demand forecasting AI.
        Based on the following 90-day sales data for a pharmacy:
        {sales_data}
        
        Predict the estimated demand for the next 30 days for each item. Format the output as a simple list. Keep it brief.
        """
    )
    
    try:
        response = llm.invoke(prompt.format(sales_data=sales_text))
        return {"status": "success", "data": response}
    except Exception as e:
        return {"status": "error", "message": f"LLM error: {str(e)}"}
