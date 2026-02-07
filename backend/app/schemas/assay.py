from pydantic import BaseModel

from app.schemas.common import AssayType


class AssayCreate(BaseModel):
    shipment_id: int
    assay_type: AssayType
    fe: float | None = None
    moisture: float | None = None
    sio2: float | None = None
    al2o3: float | None = None
    p: float | None = None
    s: float | None = None


class AssayUpdate(BaseModel):
    fe: float | None = None
    moisture: float | None = None
    sio2: float | None = None
    al2o3: float | None = None
    p: float | None = None
    s: float | None = None


class AssayOut(BaseModel):
    id: int
    shipment_id: int
    assay_type: str
    fe: float | None
    moisture: float | None
    sio2: float | None
    al2o3: float | None
    p: float | None
    s: float | None

    model_config = {"from_attributes": True}
