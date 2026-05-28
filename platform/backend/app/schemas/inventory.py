from datetime import date
from pydantic import BaseModel, Field


class ItemCreate(BaseModel):
    company_id: str
    branch_id: str
    sku: str
    name: str
    hsn_code: str | None = None
    gst_rate: float = Field(default=0, ge=0, le=28)
    reorder_level: int = 0
    rack_code: str | None = None


class BatchCreate(BaseModel):
    company_id: str
    branch_id: str
    item_id: str
    batch_no: str
    expiry_date: date
    mrp: float
    purchase_rate: float
    quantity: int
