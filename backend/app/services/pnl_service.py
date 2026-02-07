"""P&L service: realized (from matches) and unrealized (from open positions)."""

from sqlalchemy.orm import Session

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.models.match import Match
from app.models.mtm import MtmRecord
from app.schemas.pnl import (
    RealizedPnlItem,
    UnrealizedPnlItem,
    PnlByContract,
    PnlSummary,
)


def _get_weighted_avg_price(db: Session, contract_id: int) -> float | None:
    shipments = (
        db.query(Shipment)
        .filter(Shipment.contract_id == contract_id, Shipment.status != "CANCELLED")
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


def get_realized_pnl(db: Session) -> list[RealizedPnlItem]:
    matches = db.query(Match).all()
    return [
        RealizedPnlItem(
            match_id=m.id,
            buy_contract_id=m.buy_contract_id,
            sell_contract_id=m.sell_contract_id,
            matched_quantity=m.matched_quantity,
            buy_price=m.buy_price,
            sell_price=m.sell_price,
            realized_pnl=m.realized_pnl,
        )
        for m in matches
    ]


def get_unrealized_pnl(db: Session) -> list[UnrealizedPnlItem]:
    """Unrealized P&L from latest MTM records per contract."""
    contracts = db.query(Contract).filter(Contract.status.in_(["OPEN", "EXECUTED"])).all()
    items = []
    for c in contracts:
        # Get latest MTM record
        latest_mtm = (
            db.query(MtmRecord)
            .filter(MtmRecord.contract_id == c.id)
            .order_by(MtmRecord.valuation_date.desc())
            .first()
        )
        contract_price = _get_weighted_avg_price(db, c.id)

        if latest_mtm and latest_mtm.open_quantity > 0:
            items.append(UnrealizedPnlItem(
                contract_id=c.id,
                direction=c.direction,
                open_quantity=latest_mtm.open_quantity,
                contract_price=contract_price,
                market_price=latest_mtm.curve_price,
                unrealized_pnl=latest_mtm.mtm_value,
            ))
    return items


def get_pnl_summary(db: Session) -> PnlSummary:
    contracts = db.query(Contract).filter(Contract.status != "CANCELLED").all()

    by_contract = []
    total_realized = 0.0
    total_unrealized = 0.0

    for c in contracts:
        # Realized from matches
        buy_matches = db.query(Match).filter(Match.buy_contract_id == c.id).all()
        sell_matches = db.query(Match).filter(Match.sell_contract_id == c.id).all()
        realized = sum(
            m.realized_pnl for m in (buy_matches + sell_matches) if m.realized_pnl is not None
        )
        # Avoid double counting: only count from buy side
        realized_buy = sum(m.realized_pnl for m in buy_matches if m.realized_pnl is not None)

        # Unrealized from latest MTM
        latest_mtm = (
            db.query(MtmRecord)
            .filter(MtmRecord.contract_id == c.id)
            .order_by(MtmRecord.valuation_date.desc())
            .first()
        )
        unrealized = latest_mtm.mtm_value if latest_mtm else 0.0

        # Only add realized for buy-side to avoid double counting
        if c.direction == "BUY":
            by_contract.append(PnlByContract(
                contract_id=c.id,
                reference=c.reference,
                direction=c.direction,
                realized_pnl=round(realized_buy, 2),
                unrealized_pnl=round(unrealized, 2),
                total_pnl=round(realized_buy + unrealized, 2),
            ))
            total_realized += realized_buy
        else:
            by_contract.append(PnlByContract(
                contract_id=c.id,
                reference=c.reference,
                direction=c.direction,
                realized_pnl=0.0,
                unrealized_pnl=round(unrealized, 2),
                total_pnl=round(unrealized, 2),
            ))

        total_unrealized += unrealized

    return PnlSummary(
        total_realized=round(total_realized, 2),
        total_unrealized=round(total_unrealized, 2),
        total_pnl=round(total_realized + total_unrealized, 2),
        by_contract=by_contract,
    )
