import time
from services.llm_service import llm

print("Sending test request to Llama 3.2...")
t0 = time.time()
try:
    response = llm.invoke("Say hello world in JSON format.")
    print("Response:", response)
except Exception as e:
    print("Error:", e)
t1 = time.time()
print(f"LLM request took: {t1 - t0:.2f} seconds")
