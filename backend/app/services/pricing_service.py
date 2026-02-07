"""Core pricing engine: QP resolution, formula evaluation, provisional/final pricing, P&F settlement."""

from datetime import date, timedelta
from calendar import monthrange

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.models.assay import Assay
from app.services.price_curve_service import get_curve_average
from app.services.pricing_formula_service import evaluate_formula, get_formula
from app.schemas.pricing_formula import PriceBreakdown


def resolve_qp_dates(
    qp_convention: str,
    bl_date: str,
    qp_start_offset: int | None = None,
    qp_end_offset: int | None = None,
) -> tuple[str, str]:
    """Resolve QP start/end dates based on convention and BL date.

    Returns (start_date, end_date) as ISO-8601 strings.
    """
    bl = date.fromisoformat(bl_date)

    if qp_convention == "MONTH_OF_BL":
        start = bl.replace(day=1)
        _, last_day = monthrange(bl.year, bl.month)
        end = bl.replace(day=last_day)

    elif qp_convention == "MONTH_PRIOR_BL":
        first_of_bl_month = bl.replace(day=1)
        prior_month_end = first_of_bl_month - timedelta(days=1)
        start = prior_month_end.replace(day=1)
        end = prior_month_end

    elif qp_convention == "MONTH_AFTER_BL":
        _, last_day = monthrange(bl.year, bl.month)
        next_month_start = bl.replace(day=last_day) + timedelta(days=1)
        _, next_last = monthrange(next_month_start.year, next_month_start.month)
        start = next_month_start
        end = next_month_start.replace(day=next_last)

    elif qp_convention == "CUSTOM":
        if qp_start_offset is None or qp_end_offset is None:
            raise HTTPException(status_code=400, detail="CUSTOM QP requires start and end offsets")
        start = bl + timedelta(days=qp_start_offset)
        end = bl + timedelta(days=qp_end_offset)

    else:
        raise HTTPException(status_code=400, detail=f"Unknown QP convention: {qp_convention}")

    return start.isoformat(), end.isoformat()


def _assay_to_dict(assay: Assay) -> dict[str, float | None]:
    return {
        "sio2": assay.sio2,
        "al2o3": assay.al2o3,
        "p": assay.p,
        "s": assay.s,
    }


def compute_provisional_price(
    db: Session,
    shipment: Shipment,
    contract: Contract,
) -> tuple[float, PriceBreakdown]:
    """Compute provisional price for a shipment using provisional assay."""
    if not shipment.bl_date:
        raise HTTPException(status_code=400, detail="Shipment has no BL date")

    # Get provisional assay
    prov_assay = (
        db.query(Assay)
        .filter(Assay.shipment_id == shipment.id, Assay.assay_type == "PROVISIONAL")
        .first()
    )
    if not prov_assay:
        raise HTTPException(status_code=400, detail="No provisional assay found for this shipment")

    formula = get_formula(db, contract.pricing_formula_id)

    # Resolve QP dates
    qp_start, qp_end = resolve_qp_dates(
        contract.qp_convention,
        shipment.bl_date,
        contract.qp_start_offset,
        contract.qp_end_offset,
    )

    # Get QP average
    qp_avg, _ = get_curve_average(db, formula.curve_id, qp_start, qp_end)

    # Evaluate formula
    breakdown = evaluate_formula(
        formula=formula,
        qp_average=qp_avg,
        fe=prov_assay.fe,
        moisture=prov_assay.moisture,
        assay_values=_assay_to_dict(prov_assay),
    )

    # Cache on shipment
    shipment.provisional_price = breakdown.total_price
    db.commit()
    db.refresh(shipment)

    return breakdown.total_price, breakdown


def compute_final_price(
    db: Session,
    shipment: Shipment,
    contract: Contract,
) -> tuple[float, PriceBreakdown, float | None]:
    """Compute final price and P&F settlement.

    Returns (final_price, breakdown, pnf_amount).
    """
    if not shipment.bl_date:
        raise HTTPException(status_code=400, detail="Shipment has no BL date")

    # Get final assay
    final_assay = (
        db.query(Assay)
        .filter(Assay.shipment_id == shipment.id, Assay.assay_type == "FINAL")
        .first()
    )
    if not final_assay:
        raise HTTPException(status_code=400, detail="No final assay found for this shipment")

    formula = get_formula(db, contract.pricing_formula_id)

    qp_start, qp_end = resolve_qp_dates(
        contract.qp_convention,
        shipment.bl_date,
        contract.qp_start_offset,
        contract.qp_end_offset,
    )

    qp_avg, _ = get_curve_average(db, formula.curve_id, qp_start, qp_end)

    breakdown = evaluate_formula(
        formula=formula,
        qp_average=qp_avg,
        fe=final_assay.fe,
        moisture=final_assay.moisture,
        assay_values=_assay_to_dict(final_assay),
    )

    final_price = breakdown.total_price

    # P&F settlement
    pnf_amount = None
    if shipment.provisional_price is not None and shipment.bl_quantity is not None:
        pnf_amount = round((final_price - shipment.provisional_price) * shipment.bl_quantity, 2)

    # Cache on shipment
    shipment.final_price = final_price
    shipment.pnf_amount = pnf_amount
    db.commit()
    db.refresh(shipment)

    return final_price, breakdown, pnf_amount
