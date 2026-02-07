from pydantic import BaseModel


class MatchCreate(BaseModel):
    buy_contract_id: int
    sell_contract_id: int
    matched_quantity: float
    match_date: str


class MatchOut(BaseModel):
    id: int
    buy_contract_id: int
    sell_contract_id: int
    matched_quantity: float
    buy_price: float | None
    sell_price: float | None
    realized_pnl: float | None
    match_date: str

    model_config = {"from_attributes": True}
