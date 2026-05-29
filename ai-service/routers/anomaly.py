from fastapi import APIRouter
from langchain_community.llms import Ollama
from langchain.prompts import PromptTemplate
from db import get_db_connection

router = APIRouter()
llm = Ollama(model="llama3")

@router.get("/scan")
def detect_anomalies():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get recent 20 bills
    cur.execute("""
        SELECT id, "billNo", "customerName", "total", "createdAt"
        FROM "Bills"
        ORDER BY "createdAt" DESC
        LIMIT 20
    """)
    
    bills = cur.fetchall()
    cur.close()
    conn.close()
    
    if not bills:
        return {"status": "success", "data": "No recent transactions found."}
    
    transactions_text = "\n".join([
        f"ID: {b[0]}, BillNo: {b[1]}, Customer: {b[2]}, Total: ₹{b[3]}, Date: {b[4]}" 
        for b in bills
    ])

    prompt = PromptTemplate(
        input_variables=["transactions"],
        template="""
        You are a financial fraud and anomaly detection AI.
        Review the following recent transactions:
        {transactions}
        
        Identify any suspicious patterns (e.g., abnormally large totals, rapid duplicate bills to the same customer, or unusual off-hours activity).
        Provide a risk-scored analysis for any anomalies found. If everything looks normal, say "No anomalies detected." Keep it brief.
        """
    )
    
    try:
        response = llm.invoke(prompt.format(transactions=transactions_text))
        return {"status": "success", "data": response}
    except Exception as e:
        return {"status": "error", "message": f"LLM error: {str(e)}"}
