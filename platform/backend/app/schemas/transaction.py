from datetime import date
from pydantic import BaseModel, Field


class PurchaseLineIn(BaseModel):
    item_id: str
    item_batch_id: str
    quantity: int = Field(gt=0)
    free_quantity: int = Field(default=0, ge=0)
    rate: float = Field(gt=0)
    gst_rate: float = Field(default=0, ge=0, le=28)


class PurchaseCreate(BaseModel):
    company_id: str
    branch_id: str
    supplier_id: str
    invoice_no: str
    invoice_date: date
    discount_amount: float = Field(default=0, ge=0)
    lines: list[PurchaseLineIn]


class SalesLineIn(BaseModel):
    item_id: str
    item_batch_id: str
    quantity: int = Field(gt=0)
    free_quantity: int = Field(default=0, ge=0)
    rate: float = Field(gt=0)
    gst_rate: float = Field(default=0, ge=0, le=28)


class SalesCreate(BaseModel):
    company_id: str
    branch_id: str
    customer_id: str
    invoice_no: str
    invoice_date: date
    discount_amount: float = Field(default=0, ge=0)
    payment_status: str = Field(default="paid")
    lines: list[SalesLineIn]
