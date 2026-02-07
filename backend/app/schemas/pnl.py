from pydantic import BaseModel


class RealizedPnlItem(BaseModel):
    match_id: int
    buy_contract_id: int
    sell_contract_id: int
    matched_quantity: float
    buy_price: float | None
    sell_price: float | None
    realized_pnl: float | None


class UnrealizedPnlItem(BaseModel):
    contract_id: int
    direction: str
    open_quantity: float
    contract_price: float | None
    market_price: float | None
    unrealized_pnl: float | None


class PnlByContract(BaseModel):
    contract_id: int
    reference: str
    direction: str
    realized_pnl: float
    unrealized_pnl: float
    total_pnl: float


class PnlSummary(BaseModel):
    total_realized: float
    total_unrealized: float
    total_pnl: float
    by_contract: list[PnlByContract]
