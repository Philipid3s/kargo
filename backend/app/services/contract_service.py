from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractOpenQuantity,
)


def list_contracts(db: Session, direction: str | None = None, status: str | None = None) -> list[Contract]:
    q = db.query(Contract)
    if direction:
        q = q.filter(Contract.direction == direction)
    if status:
        q = q.filter(Contract.status == status)
    return q.order_by(Contract.delivery_start).all()


def get_contract(db: Session, contract_id: int) -> Contract:
    contract = db.query(Contract).filter(Contract.id == contract_id).first()
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    return contract


def create_contract(db: Session, data: ContractCreate) -> Contract:
    existing = db.query(Contract).filter(Contract.reference == data.reference).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Contract reference '{data.reference}' already exists")
    contract = Contract(**data.model_dump())
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def update_contract(db: Session, contract_id: int, data: ContractUpdate) -> Contract:
    contract = get_contract(db, contract_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contract, field, value)
    db.commit()
    db.refresh(contract)
    return contract


def update_contract_status(db: Session, contract_id: int, status: str) -> Contract:
    contract = get_contract(db, contract_id)
    contract.status = status
    db.commit()
    db.refresh(contract)
    return contract


def delete_contract(db: Session, contract_id: int) -> None:
    contract = get_contract(db, contract_id)
    db.delete(contract)
    db.commit()


def get_open_quantity(db: Session, contract_id: int) -> ContractOpenQuantity:
    contract = get_contract(db, contract_id)
    shipped = (
        db.query(Shipment)
        .filter(
            Shipment.contract_id == contract_id,
            Shipment.status != "CANCELLED",
            Shipment.bl_quantity.isnot(None),
        )
        .all()
    )
    shipped_qty = sum(s.bl_quantity for s in shipped)
    return ContractOpenQuantity(
        contract_id=contract.id,
        total_quantity=contract.quantity,
        shipped_quantity=shipped_qty,
        open_quantity=contract.quantity - shipped_qty,
    )
