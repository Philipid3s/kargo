from pydantic import BaseModel


class MtmRunRequest(BaseModel):
    valuation_date: str
    snapshot_date: str | None = None  # defaults to valuation_date


class MtmRecordOut(BaseModel):
    id: int
    contract_id: int
    valuation_date: str
    curve_price: float
    contract_price: float | None
    open_quantity: float
    direction: str
    mtm_value: float

    model_config = {"from_attributes": True}


class MtmPortfolioOut(BaseModel):
    valuation_date: str
    records: list[MtmRecordOut]
    total_mtm: float
