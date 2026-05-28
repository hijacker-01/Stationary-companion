from pydantic import BaseModel


class CompanyCreate(BaseModel):
    legal_name: str
    gstin: str | None = None
    pan: str | None = None
