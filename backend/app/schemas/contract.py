from pydantic import BaseModel

from app.schemas.common import Direction, ContractStatus, QPConvention


class ContractCreate(BaseModel):
    reference: str
    direction: Direction
    counterparty: str
    commodity: str = "Iron Ore Fines"
    quantity: float
    uom: str = "DMT"
    incoterm: str = "CFR"
    delivery_start: str
    delivery_end: str
    status: ContractStatus = ContractStatus.OPEN
    qp_convention: QPConvention = QPConvention.MONTH_OF_BL
    qp_start_offset: int | None = None
    qp_end_offset: int | None = None
    pricing_formula_id: int


class ContractUpdate(BaseModel):
    reference: str | None = None
    direction: Direction | None = None
    counterparty: str | None = None
    commodity: str | None = None
    quantity: float | None = None
    uom: str | None = None
    incoterm: str | None = None
    delivery_start: str | None = None
    delivery_end: str | None = None
    qp_convention: QPConvention | None = None
    qp_start_offset: int | None = None
    qp_end_offset: int | None = None
    pricing_formula_id: int | None = None


class ContractStatusUpdate(BaseModel):
    status: ContractStatus


class ContractOut(BaseModel):
    id: int
    reference: str
    direction: str
    counterparty: str
    commodity: str
    quantity: float
    uom: str
    incoterm: str
    delivery_start: str
    delivery_end: str
    status: str
    qp_convention: str
    qp_start_offset: int | None
    qp_end_offset: int | None
    pricing_formula_id: int

    model_config = {"from_attributes": True}


class ContractOpenQuantity(BaseModel):
    contract_id: int
    total_quantity: float
    shipped_quantity: float
    open_quantity: float
