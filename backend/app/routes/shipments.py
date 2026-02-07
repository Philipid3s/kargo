from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.shipment import (
    ShipmentCreate,
    ShipmentUpdate,
    ShipmentStatusUpdate,
    ShipmentOut,
)
from app.schemas.pricing_formula import PriceBreakdown
from app.services import shipment_service as svc
from app.services import pricing_service
from app.services import contract_service

router = APIRouter(prefix="/api/v1/shipments", tags=["Shipments"])


@router.get("/", response_model=list[ShipmentOut])
def list_shipments(contract_id: int | None = Query(None), db: Session = Depends(get_db)):
    return svc.list_shipments(db, contract_id)


@router.post("/", response_model=ShipmentOut, status_code=201)
def create_shipment(data: ShipmentCreate, db: Session = Depends(get_db)):
    return svc.create_shipment(db, data)


@router.get("/{shipment_id}", response_model=ShipmentOut)
def get_shipment(shipment_id: int, db: Session = Depends(get_db)):
    return svc.get_shipment(db, shipment_id)


@router.patch("/{shipment_id}", response_model=ShipmentOut)
def update_shipment(shipment_id: int, data: ShipmentUpdate, db: Session = Depends(get_db)):
    return svc.update_shipment(db, shipment_id, data)


@router.patch("/{shipment_id}/status", response_model=ShipmentOut)
def update_shipment_status(shipment_id: int, data: ShipmentStatusUpdate, db: Session = Depends(get_db)):
    return svc.update_shipment_status(db, shipment_id, data.status.value)


@router.delete("/{shipment_id}", status_code=204)
def delete_shipment(shipment_id: int, db: Session = Depends(get_db)):
    svc.delete_shipment(db, shipment_id)


class ProvisionalPriceResponse(PriceBreakdown):
    shipment_id: int
    provisional_price: float


class FinalPriceResponse(PriceBreakdown):
    shipment_id: int
    final_price: float
    pnf_amount: float | None


@router.post("/{shipment_id}/compute-provisional", response_model=ProvisionalPriceResponse)
def compute_provisional(shipment_id: int, db: Session = Depends(get_db)):
    shipment = svc.get_shipment(db, shipment_id)
    contract = contract_service.get_contract(db, shipment.contract_id)
    price, breakdown = pricing_service.compute_provisional_price(db, shipment, contract)
    return ProvisionalPriceResponse(
        shipment_id=shipment_id,
        provisional_price=price,
        **breakdown.model_dump(),
    )


@router.post("/{shipment_id}/compute-final", response_model=FinalPriceResponse)
def compute_final(shipment_id: int, db: Session = Depends(get_db)):
    shipment = svc.get_shipment(db, shipment_id)
    contract = contract_service.get_contract(db, shipment.contract_id)
    final_price, breakdown, pnf = pricing_service.compute_final_price(db, shipment, contract)
    return FinalPriceResponse(
        shipment_id=shipment_id,
        final_price=final_price,
        pnf_amount=pnf,
        **breakdown.model_dump(),
    )
