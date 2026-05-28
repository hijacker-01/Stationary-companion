from pydantic import BaseModel


class KpiSummary(BaseModel):
    total_sales: float
    total_purchases: float
    gross_margin: float
    low_stock_count: int
    near_expiry_count: int
