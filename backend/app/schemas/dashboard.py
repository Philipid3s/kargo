from pydantic import BaseModel

from app.schemas.exposure import ExposureSummary
from app.schemas.pnl import PnlSummary


class DashboardSummary(BaseModel):
    total_contracts: int
    open_contracts: int
    total_shipments: int
    active_shipments: int
    exposure: ExposureSummary
    pnl: PnlSummary
