from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.assay import AssayCreate, AssayUpdate, AssayOut
from app.services import assay_service as svc

router = APIRouter(prefix="/api/v1/assays", tags=["Assays"])


@router.get("/", response_model=list[AssayOut])
def list_assays(shipment_id: int | None = Query(None), db: Session = Depends(get_db)):
    return svc.list_assays(db, shipment_id)


@router.post("/", response_model=AssayOut, status_code=201)
def create_assay(data: AssayCreate, db: Session = Depends(get_db)):
    return svc.create_assay(db, data)


@router.get("/{assay_id}", response_model=AssayOut)
def get_assay(assay_id: int, db: Session = Depends(get_db)):
    return svc.get_assay(db, assay_id)


@router.patch("/{assay_id}", response_model=AssayOut)
def update_assay(assay_id: int, data: AssayUpdate, db: Session = Depends(get_db)):
    return svc.update_assay(db, assay_id, data)


@router.delete("/{assay_id}", status_code=204)
def delete_assay(assay_id: int, db: Session = Depends(get_db)):
    svc.delete_assay(db, assay_id)
