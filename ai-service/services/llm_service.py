import os
from langchain_ollama import ChatOllama, OllamaEmbeddings

OLLAMA_BASE   = os.getenv("OLLAMA_BASE_URL",   "http://localhost:11434")
OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL",       "llama3.2")
EMBED_MODEL   = os.getenv("OLLAMA_EMBED_MODEL", "nomic-embed-text")

# ── Shared LLM instance ───────────────────────────────────────────────────────
llm = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE,
    temperature=0,          # deterministic for structured extraction
    format="json",          # ask Ollama to return raw JSON where possible
)

# Same LLM without JSON-mode for ReAct agent (needs free-form reasoning)
llm_agent = ChatOllama(
    model=OLLAMA_MODEL,
    base_url=OLLAMA_BASE,
    temperature=0,
)

# ── Shared Embeddings instance ────────────────────────────────────────────────
embeddings = OllamaEmbeddings(
    model=EMBED_MODEL,
    base_url=OLLAMA_BASE,
)
