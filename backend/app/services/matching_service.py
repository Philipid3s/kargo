"""FIFO buy/sell matching engine.

Sort BUYs and SELLs by delivery_start ASC, match sequentially, partial matches allowed.
Realized P&L = (sell_price - buy_price) × matched_qty
"""

from datetime import date

from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.contract import Contract
from app.models.shipment import Shipment
from app.models.match import Match


def _get_weighted_avg_price(db: Session, contract_id: int) -> float | None:
    """Weighted average price for a contract (final > provisional)."""
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


def _get_matched_qty(db: Session, contract_id: int, direction: str) -> float:
    """Total already matched quantity for a contract."""
    if direction == "BUY":
        matches = db.query(Match).filter(Match.buy_contract_id == contract_id).all()
    else:
        matches = db.query(Match).filter(Match.sell_contract_id == contract_id).all()
    return sum(m.matched_quantity for m in matches)


def run_fifo_matching(db: Session) -> list[Match]:
    """Run FIFO matching across all open/executed contracts.

    Clears existing matches and re-runs from scratch.
    """
    # Clear existing matches
    db.query(Match).delete()
    db.flush()

    buys = (
        db.query(Contract)
        .filter(Contract.direction == "BUY", Contract.status.in_(["OPEN", "EXECUTED"]))
        .order_by(Contract.delivery_start)
        .all()
    )
    sells = (
        db.query(Contract)
        .filter(Contract.direction == "SELL", Contract.status.in_(["OPEN", "EXECUTED"]))
        .order_by(Contract.delivery_start)
        .all()
    )

    # Build remaining qty maps
    buy_remaining = {b.id: b.quantity for b in buys}
    sell_remaining = {s.id: s.quantity for s in sells}

    buy_prices = {b.id: _get_weighted_avg_price(db, b.id) for b in buys}
    sell_prices = {s.id: _get_weighted_avg_price(db, s.id) for s in sells}

    matches = []
    today = date.today().isoformat()

    si = 0  # sell index
    for buy in buys:
        while si < len(sells) and buy_remaining[buy.id] > 0:
            sell = sells[si]
            if sell_remaining[sell.id] <= 0:
                si += 1
                continue

            match_qty = min(buy_remaining[buy.id], sell_remaining[sell.id])
            bp = buy_prices[buy.id]
            sp = sell_prices[sell.id]

            realized_pnl = None
            if bp is not None and sp is not None:
                realized_pnl = round((sp - bp) * match_qty, 2)

            m = Match(
                buy_contract_id=buy.id,
                sell_contract_id=sell.id,
                matched_quantity=round(match_qty, 4),
                buy_price=round(bp, 4) if bp else None,
                sell_price=round(sp, 4) if sp else None,
                realized_pnl=realized_pnl,
                match_date=today,
            )
            db.add(m)
            matches.append(m)

            buy_remaining[buy.id] -= match_qty
            sell_remaining[sell.id] -= match_qty

            if sell_remaining[sell.id] <= 0:
                si += 1

    db.commit()
    for m in matches:
        db.refresh(m)
    return matches


def create_manual_match(
    db: Session,
    buy_contract_id: int,
    sell_contract_id: int,
    matched_quantity: float,
    match_date: str,
) -> Match:
    buy = db.query(Contract).filter(Contract.id == buy_contract_id).first()
    sell = db.query(Contract).filter(Contract.id == sell_contract_id).first()
    if not buy or buy.direction != "BUY":
        raise HTTPException(status_code=400, detail="Invalid buy contract")
    if not sell or sell.direction != "SELL":
        raise HTTPException(status_code=400, detail="Invalid sell contract")

    bp = _get_weighted_avg_price(db, buy_contract_id)
    sp = _get_weighted_avg_price(db, sell_contract_id)
    realized_pnl = round((sp - bp) * matched_quantity, 2) if bp and sp else None

    m = Match(
        buy_contract_id=buy_contract_id,
        sell_contract_id=sell_contract_id,
        matched_quantity=round(matched_quantity, 4),
        buy_price=round(bp, 4) if bp else None,
        sell_price=round(sp, 4) if sp else None,
        realized_pnl=realized_pnl,
        match_date=match_date,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


def list_matches(db: Session) -> list[Match]:
    return db.query(Match).all()


def delete_match(db: Session, match_id: int) -> None:
    m = db.query(Match).filter(Match.id == match_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(m)
    db.commit()


def unwind_all(db: Session) -> int:
    """Delete all matches. Returns count deleted."""
    count = db.query(Match).count()
    db.query(Match).delete()
    db.commit()
    return count
