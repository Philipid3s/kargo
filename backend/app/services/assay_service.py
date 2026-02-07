from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.assay import Assay
from app.schemas.assay import AssayCreate, AssayUpdate


def list_assays(db: Session, shipment_id: int | None = None) -> list[Assay]:
    q = db.query(Assay)
    if shipment_id:
        q = q.filter(Assay.shipment_id == shipment_id)
    return q.all()


def get_assay(db: Session, assay_id: int) -> Assay:
    assay = db.query(Assay).filter(Assay.id == assay_id).first()
    if not assay:
        raise HTTPException(status_code=404, detail="Assay not found")
    return assay


def get_assay_by_shipment_and_type(db: Session, shipment_id: int, assay_type: str) -> Assay | None:
    return (
        db.query(Assay)
        .filter(Assay.shipment_id == shipment_id, Assay.assay_type == assay_type)
        .first()
    )


def create_assay(db: Session, data: AssayCreate) -> Assay:
    existing = get_assay_by_shipment_and_type(db, data.shipment_id, data.assay_type)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"{data.assay_type} assay already exists for shipment {data.shipment_id}",
        )
    assay = Assay(**data.model_dump())
    db.add(assay)
    db.commit()
    db.refresh(assay)
    return assay


def update_assay(db: Session, assay_id: int, data: AssayUpdate) -> Assay:
    assay = get_assay(db, assay_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(assay, field, value)
    db.commit()
    db.refresh(assay)
    return assay


def delete_assay(db: Session, assay_id: int) -> None:
    assay = get_assay(db, assay_id)
    db.delete(assay)
    db.commit()
