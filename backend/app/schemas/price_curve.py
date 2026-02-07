from pydantic import BaseModel


# --- CurveData ---
class CurveDataCreate(BaseModel):
    price_date: str
    price: float
    snapshot_date: str


class CurveDataOut(BaseModel):
    id: int
    curve_id: int
    price_date: str
    price: float
    snapshot_date: str

    model_config = {"from_attributes": True}


# --- PriceCurve ---
class PriceCurveCreate(BaseModel):
    code: str
    name: str
    currency: str = "USD"
    uom: str = "DMT"


class PriceCurveUpdate(BaseModel):
    name: str | None = None
    currency: str | None = None
    uom: str | None = None


class PriceCurveOut(BaseModel):
    id: int
    code: str
    name: str
    currency: str
    uom: str

    model_config = {"from_attributes": True}


class PriceCurveWithData(PriceCurveOut):
    data_points: list[CurveDataOut] = []


class BulkCurveDataUpload(BaseModel):
    data_points: list[CurveDataCreate]


class CurveAverageRequest(BaseModel):
    start_date: str
    end_date: str
    snapshot_date: str | None = None


class CurveAverageResponse(BaseModel):
    curve_id: int
    start_date: str
    end_date: str
    average_price: float
    data_point_count: int
