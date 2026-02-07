from pydantic import BaseModel


class ExposureByMonth(BaseModel):
    month: str  # YYYY-MM
    long_quantity: float
    short_quantity: float
    net_quantity: float
    net_exposure_usd: float


class ExposureByDirection(BaseModel):
    direction: str
    total_open_quantity: float
    total_exposure_usd: float


class ExposureSummary(BaseModel):
    by_month: list[ExposureByMonth]
    by_direction: list[ExposureByDirection]
    total_net_exposure_usd: float
