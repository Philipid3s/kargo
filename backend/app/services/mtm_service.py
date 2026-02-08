"""Mark-to-Market service.

MTM = (Curve Price - Contract Price) × Open Quantity × Direction Factor
Direction: +1 BUY, -1 SELL
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.models.mtm import MtmRecord
from app.services.price_curve_service import get_curve_average
from app.services.pricing_formula_service import get_formula
from app.services.contract_service import get_open_quantity, get_contract
from app.schemas.mtm import MtmRecordOut, MtmPortfolioOut


def _get_contract_price(db: Session, contract: Contract) -> float | None:
    """Weighted average price across shipments (final > provisional)."""
    shipments = (
        db.query(Shipment)
        .filter(Shipment.contract_id == contract.id, Shipment.status != "CANCELLED")
        .all()
    )

    total_qty = 0.0
    total_value = 0.0
    for s in shipments:
        price = s.final_price or s.provisional_price
        qty = s.bl_quantity
        if price is not None and qty is not None:
            total_qty += qty
            total_value += price * qty

    if total_qty == 0:
        return None
    return total_value / total_qty


def _get_current_curve_price(
    db: Session,
    curve_id: int,
    valuation_date: str,
    snapshot_date: str,
) -> float:
    """Get curve price for valuation date.

    Falls back to the latest available price at or before the valuation date.
    """
    from app.models.price_curve import CurveData
    from sqlalchemy import func

    # 1) Try exact date with snapshot
    try:
        avg, _ = get_curve_average(db, curve_id, valuation_date, valuation_date, snapshot_date)
        return avg
    except HTTPException:
        pass

    # 2) Try exact date without snapshot filter
    try:
        avg, _ = get_curve_average(db, curve_id, valuation_date, valuation_date)
        return avg
    except HTTPException:
        pass

    # 3) Fall back to the latest available price_date <= valuation_date
    latest = (
        db.query(CurveData)
        .filter(CurveData.curve_id == curve_id, CurveData.price_date <= valuation_date)
        .order_by(CurveData.price_date.desc())
        .first()
    )
    if latest:
        return latest.price

    # 4) Last resort: the most recent price in the entire curve
    most_recent = (
        db.query(CurveData)
        .filter(CurveData.curve_id == curve_id)
        .order_by(CurveData.price_date.desc())
        .first()
    )
    if most_recent:
        return most_recent.price

    raise HTTPException(status_code=404, detail="No curve data available for MTM valuation")


def run_mtm_for_contract(
    db: Session,
    contract_id: int,
    valuation_date: str,
    snapshot_date: str | None = None,
) -> MtmRecord:
    snap = snapshot_date or valuation_date
    contract = get_contract(db, contract_id)
    formula = get_formula(db, contract.pricing_formula_id)

    open_qty_info = get_open_quantity(db, contract_id)
    open_qty = open_qty_info.open_quantity

    curve_price = _get_current_curve_price(db, formula.curve_id, valuation_date, snap)

    if open_qty <= 0:
        # No open position — MTM is 0 but still report actual curve price
        record = MtmRecord(
            contract_id=contract_id,
            valuation_date=valuation_date,
            curve_price=round(curve_price, 4),
            contract_price=None,
            open_quantity=0,
            direction=contract.direction,
            mtm_value=0,
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    contract_price = _get_contract_price(db, contract)

    direction_factor = 1.0 if contract.direction == "BUY" else -1.0

    if contract_price is not None:
        mtm_value = (curve_price - contract_price) * open_qty * direction_factor
    else:
        mtm_value = 0.0

    record = MtmRecord(
        contract_id=contract_id,
        valuation_date=valuation_date,
        curve_price=round(curve_price, 4),
        contract_price=round(contract_price, 4) if contract_price else None,
        open_quantity=round(open_qty, 4),
        direction=contract.direction,
        mtm_value=round(mtm_value, 2),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def run_mtm_portfolio(
    db: Session,
    valuation_date: str,
    snapshot_date: str | None = None,
) -> MtmPortfolioOut:
    contracts = db.query(Contract).filter(Contract.status.in_(["OPEN", "EXECUTED"])).all()
    records = []
    for c in contracts:
        rec = run_mtm_for_contract(db, c.id, valuation_date, snapshot_date)
        records.append(rec)

    total = sum(r.mtm_value for r in records)
    return MtmPortfolioOut(
        valuation_date=valuation_date,
        records=[MtmRecordOut.model_validate(r) for r in records],
        total_mtm=round(total, 2),
    )


def get_mtm_history(
    db: Session,
    contract_id: int | None = None,
    valuation_date: str | None = None,
) -> list[MtmRecord]:
    q = db.query(MtmRecord)
    if contract_id:
        q = q.filter(MtmRecord.contract_id == contract_id)
    if valuation_date:
        q = q.filter(MtmRecord.valuation_date == valuation_date)
    return q.order_by(MtmRecord.valuation_date.desc()).all()
