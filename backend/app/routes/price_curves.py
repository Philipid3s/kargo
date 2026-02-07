from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.price_curve import (
    PriceCurveCreate,
    PriceCurveUpdate,
    PriceCurveOut,
    CurveDataOut,
    BulkCurveDataUpload,
    CurveAverageResponse,
)
from app.services import price_curve_service as svc

router = APIRouter(prefix="/api/v1/price-curves", tags=["Price Curves"])


@router.get("/", response_model=list[PriceCurveOut])
def list_curves(db: Session = Depends(get_db)):
    return svc.list_curves(db)


@router.post("/", response_model=PriceCurveOut, status_code=201)
def create_curve(data: PriceCurveCreate, db: Session = Depends(get_db)):
    return svc.create_curve(db, data)


@router.get("/{curve_id}", response_model=PriceCurveOut)
def get_curve(curve_id: int, db: Session = Depends(get_db)):
    return svc.get_curve(db, curve_id)


@router.patch("/{curve_id}", response_model=PriceCurveOut)
def update_curve(curve_id: int, data: PriceCurveUpdate, db: Session = Depends(get_db)):
    return svc.update_curve(db, curve_id, data)


@router.delete("/{curve_id}", status_code=204)
def delete_curve(curve_id: int, db: Session = Depends(get_db)):
    svc.delete_curve(db, curve_id)


@router.post("/{curve_id}/data", response_model=list[CurveDataOut], status_code=201)
def upload_curve_data(curve_id: int, payload: BulkCurveDataUpload, db: Session = Depends(get_db)):
    return svc.bulk_upload_data(db, curve_id, payload.data_points)


@router.get("/{curve_id}/data", response_model=list[CurveDataOut])
def get_curve_data(
    curve_id: int,
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    snapshot_date: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return svc.get_curve_data(db, curve_id, start_date, end_date, snapshot_date)


@router.get("/{curve_id}/average", response_model=CurveAverageResponse)
def get_curve_average(
    curve_id: int,
    start_date: str = Query(...),
    end_date: str = Query(...),
    snapshot_date: str | None = Query(None),
    db: Session = Depends(get_db),
):
    avg, count = svc.get_curve_average(db, curve_id, start_date, end_date, snapshot_date)
    return CurveAverageResponse(
        curve_id=curve_id,
        start_date=start_date,
        end_date=end_date,
        average_price=round(avg, 4),
        data_point_count=count,
    )
