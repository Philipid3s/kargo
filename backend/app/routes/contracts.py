from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractStatusUpdate,
    ContractOut,
    ContractOpenQuantity,
)
from app.services import contract_service as svc

router = APIRouter(prefix="/api/v1/contracts", tags=["Contracts"])


@router.get("/", response_model=list[ContractOut])
def list_contracts(
    direction: str | None = Query(None),
    status: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return svc.list_contracts(db, direction, status)


@router.post("/", response_model=ContractOut, status_code=201)
def create_contract(data: ContractCreate, db: Session = Depends(get_db)):
    return svc.create_contract(db, data)


@router.get("/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, db: Session = Depends(get_db)):
    return svc.get_contract(db, contract_id)


@router.patch("/{contract_id}", response_model=ContractOut)
def update_contract(contract_id: int, data: ContractUpdate, db: Session = Depends(get_db)):
    return svc.update_contract(db, contract_id, data)


@router.patch("/{contract_id}/status", response_model=ContractOut)
def update_contract_status(contract_id: int, data: ContractStatusUpdate, db: Session = Depends(get_db)):
    return svc.update_contract_status(db, contract_id, data.status.value)


@router.delete("/{contract_id}", status_code=204)
def delete_contract(contract_id: int, db: Session = Depends(get_db)):
    svc.delete_contract(db, contract_id)


@router.get("/{contract_id}/open-quantity", response_model=ContractOpenQuantity)
def get_open_quantity(contract_id: int, db: Session = Depends(get_db)):
    return svc.get_open_quantity(db, contract_id)
