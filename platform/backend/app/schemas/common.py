from pydantic import BaseModel, Field


class PageRequest(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=25, ge=1, le=200)
    search: str | None = None


class PageResponse(BaseModel):
    page: int
    page_size: int
    total: int
    items: list
