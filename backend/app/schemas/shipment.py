from pydantic import BaseModel

from app.schemas.common import ShipmentStatus


class ShipmentCreate(BaseModel):
    reference: str
    contract_id: int
    vessel_name: str | None = None
    bl_date: str | None = None
    bl_quantity: float | None = None
    status: ShipmentStatus = ShipmentStatus.PLANNED


class ShipmentUpdate(BaseModel):
    reference: str | None = None
    vessel_name: str | None = None
    bl_date: str | None = None
    bl_quantity: float | None = None


class ShipmentStatusUpdate(BaseModel):
    status: ShipmentStatus


class ShipmentOut(BaseModel):
    id: int
    reference: str
    contract_id: int
    vessel_name: str | None
    bl_date: str | None
    bl_quantity: float | None
    status: str
    provisional_price: float | None
    final_price: float | None
    pnf_amount: float | None

    model_config = {"from_attributes": True}
