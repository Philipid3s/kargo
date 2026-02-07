"""Tests for P&L service."""

from app.services.pnl_service import get_pnl_summary, get_realized_pnl, get_unrealized_pnl
from app.services.matching_service import run_fifo_matching
from app.services.mtm_service import run_mtm_for_contract
from app.services.pricing_service import compute_provisional_price
from app.models.shipment import Shipment
from app.models.assay import Assay


class TestPnL:
    def test_empty_pnl(self, db_session, seed_contracts):
        """P&L summary with no matches or MTM."""
        summary = get_pnl_summary(db_session)
        assert summary.total_realized == 0
        assert summary.total_unrealized == 0
        assert len(summary.by_contract) == 2

    def test_realized_pnl_from_matches(self, db_session, seed_contracts, seed_curve, seed_formula):
        """Realized P&L comes from matched positions."""
        buy, sell = seed_contracts

        # Price both sides
        for contract, ref, bl_date, qty, fe in [
            (buy, "SHP-P-001", "2025-01-15", 75000, 62.0),
            (sell, "SHP-P-002", "2025-01-18", 60000, 62.5),
        ]:
            ship = Shipment(
                reference=ref, contract_id=contract.id,
                bl_date=bl_date, bl_quantity=qty, status="DELIVERED",
            )
            db_session.add(ship)
            db_session.flush()
            db_session.add(Assay(
                shipment_id=ship.id, assay_type="PROVISIONAL",
                fe=fe, moisture=7.5,
            ))
            db_session.commit()
            compute_provisional_price(db_session, ship, contract)

        run_fifo_matching(db_session)
        realized = get_realized_pnl(db_session)
        assert len(realized) == 1
        assert realized[0].realized_pnl is not None

    def test_unrealized_pnl_from_mtm(self, db_session, seed_contracts, seed_curve, seed_formula):
        """Unrealized P&L comes from MTM."""
        buy, _ = seed_contracts

        ship = Shipment(
            reference="SHP-P-003", contract_id=buy.id,
            bl_date="2025-01-15", bl_quantity=50000, status="DELIVERED",
        )
        db_session.add(ship)
        db_session.flush()
        db_session.add(Assay(
            shipment_id=ship.id, assay_type="PROVISIONAL",
            fe=62.0, moisture=7.5,
        ))
        db_session.commit()
        compute_provisional_price(db_session, ship, buy)

        run_mtm_for_contract(db_session, buy.id, "2025-01-20", "2025-01-31")

        unrealized = get_unrealized_pnl(db_session)
        assert len(unrealized) >= 1

    def test_pnl_summary_combined(self, db_session, seed_contracts, seed_curve, seed_formula):
        """Full P&L summary with both realized and unrealized."""
        buy, sell = seed_contracts

        # Price both
        for contract, ref, bl_date, qty, fe in [
            (buy, "SHP-P-004", "2025-01-15", 75000, 62.0),
            (sell, "SHP-P-005", "2025-01-18", 60000, 62.5),
        ]:
            ship = Shipment(
                reference=ref, contract_id=contract.id,
                bl_date=bl_date, bl_quantity=qty, status="DELIVERED",
            )
            db_session.add(ship)
            db_session.flush()
            db_session.add(Assay(
                shipment_id=ship.id, assay_type="PROVISIONAL",
                fe=fe, moisture=7.5,
            ))
            db_session.commit()
            compute_provisional_price(db_session, ship, contract)

        run_fifo_matching(db_session)
        run_mtm_for_contract(db_session, buy.id, "2025-01-20", "2025-01-31")
        run_mtm_for_contract(db_session, sell.id, "2025-01-20", "2025-01-31")

        summary = get_pnl_summary(db_session)
        assert summary.total_pnl == summary.total_realized + summary.total_unrealized
        assert len(summary.by_contract) == 2
