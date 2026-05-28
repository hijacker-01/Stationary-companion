from fastapi import APIRouter

router = APIRouter()


@router.post("/ask")
def ask(question: str, company_id: str, branch_id: str):
    # Placeholder orchestration for retrieval + grounded answer generation.
    return {
        "question": question,
        "answer": "RAG pipeline scaffolded. Connect embedding store and ERP semantic retriever.",
        "citations": [],
        "company_id": company_id,
        "branch_id": branch_id,
    }
