from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.price_curve import PriceCurve, CurveData
from app.schemas.price_curve import (
    PriceCurveCreate,
    PriceCurveUpdate,
    CurveDataCreate,
)


def list_curves(db: Session) -> list[PriceCurve]:
    return db.query(PriceCurve).all()


def get_curve(db: Session, curve_id: int) -> PriceCurve:
    curve = db.query(PriceCurve).filter(PriceCurve.id == curve_id).first()
    if not curve:
        raise HTTPException(status_code=404, detail="Price curve not found")
    return curve


def get_curve_by_code(db: Session, code: str) -> PriceCurve | None:
    return db.query(PriceCurve).filter(PriceCurve.code == code).first()


def create_curve(db: Session, data: PriceCurveCreate) -> PriceCurve:
    if get_curve_by_code(db, data.code):
        raise HTTPException(status_code=409, detail=f"Curve code '{data.code}' already exists")
    curve = PriceCurve(**data.model_dump())
    db.add(curve)
    db.commit()
    db.refresh(curve)
    return curve


def update_curve(db: Session, curve_id: int, data: PriceCurveUpdate) -> PriceCurve:
    curve = get_curve(db, curve_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(curve, field, value)
    db.commit()
    db.refresh(curve)
    return curve


def delete_curve(db: Session, curve_id: int) -> None:
    curve = get_curve(db, curve_id)
    db.delete(curve)
    db.commit()


def bulk_upload_data(db: Session, curve_id: int, data_points: list[CurveDataCreate]) -> list[CurveData]:
    get_curve(db, curve_id)  # ensure exists
    records = []
    for dp in data_points:
        record = CurveData(curve_id=curve_id, **dp.model_dump())
        db.add(record)
        records.append(record)
    db.commit()
    for r in records:
        db.refresh(r)
    return records


def get_curve_data(
    db: Session,
    curve_id: int,
    start_date: str | None = None,
    end_date: str | None = None,
    snapshot_date: str | None = None,
) -> list[CurveData]:
    get_curve(db, curve_id)
    q = db.query(CurveData).filter(CurveData.curve_id == curve_id)
    if start_date:
        q = q.filter(CurveData.price_date >= start_date)
    if end_date:
        q = q.filter(CurveData.price_date <= end_date)
    if snapshot_date:
        q = q.filter(CurveData.snapshot_date == snapshot_date)
    return q.order_by(CurveData.price_date).all()


def get_curve_average(
    db: Session,
    curve_id: int,
    start_date: str,
    end_date: str,
    snapshot_date: str | None = None,
) -> tuple[float, int]:
    """Returns (average_price, count) for the given date range.

    If snapshot_date is provided, use that exact snapshot.
    Otherwise, for each price_date pick the latest available snapshot_date.
    """
    get_curve(db, curve_id)

    if snapshot_date:
        points = (
            db.query(CurveData)
            .filter(
                CurveData.curve_id == curve_id,
                CurveData.price_date >= start_date,
                CurveData.price_date <= end_date,
                CurveData.snapshot_date == snapshot_date,
            )
            .all()
        )
    else:
        from sqlalchemy import func

        # Subquery: max snapshot_date per price_date
        sub = (
            db.query(
                CurveData.price_date,
                func.max(CurveData.snapshot_date).label("max_snap"),
            )
            .filter(
                CurveData.curve_id == curve_id,
                CurveData.price_date >= start_date,
                CurveData.price_date <= end_date,
            )
            .group_by(CurveData.price_date)
            .subquery()
        )
        points = (
            db.query(CurveData)
            .join(
                sub,
                (CurveData.price_date == sub.c.price_date)
                & (CurveData.snapshot_date == sub.c.max_snap)
                & (CurveData.curve_id == curve_id),
            )
            .all()
        )

    if not points:
        raise HTTPException(status_code=404, detail="No curve data found for the given date range")

    avg = sum(p.price for p in points) / len(points)
    return avg, len(points)
