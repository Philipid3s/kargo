from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.shipment import Shipment
from app.schemas.shipment import ShipmentCreate, ShipmentUpdate


def list_shipments(db: Session, contract_id: int | None = None) -> list[Shipment]:
    q = db.query(Shipment)
    if contract_id:
        q = q.filter(Shipment.contract_id == contract_id)
    return q.all()


def get_shipment(db: Session, shipment_id: int) -> Shipment:
    shipment = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


def create_shipment(db: Session, data: ShipmentCreate) -> Shipment:
    existing = db.query(Shipment).filter(Shipment.reference == data.reference).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Shipment reference '{data.reference}' already exists")
    shipment = Shipment(**data.model_dump())
    db.add(shipment)
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment(db: Session, shipment_id: int, data: ShipmentUpdate) -> Shipment:
    shipment = get_shipment(db, shipment_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(shipment, field, value)
    db.commit()
    db.refresh(shipment)
    return shipment


def update_shipment_status(db: Session, shipment_id: int, status: str) -> Shipment:
    shipment = get_shipment(db, shipment_id)
    shipment.status = status
    db.commit()
    db.refresh(shipment)
    return shipment


def delete_shipment(db: Session, shipment_id: int) -> None:
    shipment = get_shipment(db, shipment_id)
    db.delete(shipment)
    db.commit()
