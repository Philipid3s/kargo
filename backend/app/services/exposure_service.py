"""Exposure aggregation: group open contracts by delivery month and direction."""

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.services.pricing_formula_service import get_formula
from app.services.price_curve_service import get_curve_average
from app.schemas.exposure import ExposureByMonth, ExposureByDirection, ExposureSummary


def _get_open_qty(db: Session, contract: Contract) -> float:
    shipped = (
        db.query(Shipment)
        .filter(
            Shipment.contract_id == contract.id,
            Shipment.status != "CANCELLED",
            Shipment.bl_quantity.isnot(None),
        )
        .all()
    )
    shipped_qty = sum(s.bl_quantity for s in shipped)
    return contract.quantity - shipped_qty


def _get_delivery_month(contract: Contract) -> str:
    """Extract YYYY-MM from delivery_start."""
    return contract.delivery_start[:7]


def _try_get_curve_price(db: Session, curve_id: int, month: str) -> float:
    """Try to get a representative price for a month. Returns 0 if no data."""
    start = f"{month}-01"
    # End of month approximation
    year, mon = int(month[:4]), int(month[5:7])
    if mon == 12:
        end = f"{year + 1}-01-01"
    else:
        end = f"{year}-{mon + 1:02d}-01"

    from datetime import date, timedelta
    end_date = (date.fromisoformat(end) - timedelta(days=1)).isoformat()

    try:
        avg, _ = get_curve_average(db, curve_id, start, end_date)
        return avg
    except Exception:
        return 0.0


def compute_exposure(db: Session) -> ExposureSummary:
    contracts = db.query(Contract).filter(Contract.status.in_(["OPEN", "EXECUTED"])).all()

    # Group by month
    month_data: dict[str, dict[str, float]] = defaultdict(lambda: {"long": 0.0, "short": 0.0})
    direction_data: dict[str, float] = defaultdict(float)

    # Track curve_ids per month for pricing
    month_curves: dict[str, int] = {}

    for c in contracts:
        open_qty = _get_open_qty(db, c)
        if open_qty <= 0:
            continue

        month = _get_delivery_month(c)
        formula = get_formula(db, c.pricing_formula_id)
        month_curves[month] = formula.curve_id

        if c.direction == "BUY":
            month_data[month]["long"] += open_qty
            direction_data["BUY"] += open_qty
        else:
            month_data[month]["short"] += open_qty
            direction_data["SELL"] += open_qty

    by_month = []
    for month in sorted(month_data.keys()):
        d = month_data[month]
        net = d["long"] - d["short"]
        curve_id = month_curves.get(month)
        price = _try_get_curve_price(db, curve_id, month) if curve_id else 0.0
        by_month.append(ExposureByMonth(
            month=month,
            long_quantity=round(d["long"], 2),
            short_quantity=round(d["short"], 2),
            net_quantity=round(net, 2),
            net_exposure_usd=round(net * price, 2),
        ))

    # By direction with USD exposure
    by_direction = []
    for dir_name in ["BUY", "SELL"]:
        qty = direction_data.get(dir_name, 0.0)
        by_direction.append(ExposureByDirection(
            direction=dir_name,
            total_open_quantity=round(qty, 2),
            total_exposure_usd=0.0,  # simplified — full calc would need per-contract pricing
        ))

    total_net = sum(m.net_exposure_usd for m in by_month)

    return ExposureSummary(
        by_month=by_month,
        by_direction=by_direction,
        total_net_exposure_usd=round(total_net, 2),
    )
