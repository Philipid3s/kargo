"""Tests for FIFO matching engine."""

from app.services.matching_service import run_fifo_matching, create_manual_match, unwind_all
from app.services.pricing_service import compute_provisional_price
from app.models.shipment import Shipment
from app.models.assay import Assay
from app.models.match import Match


class TestFIFOMatching:
    def test_fifo_basic(self, db_session, seed_contracts):
        """Basic FIFO: BUY 75k, SELL 60k → match 60k."""
        matches = run_fifo_matching(db_session)
        assert len(matches) == 1
        assert matches[0].matched_quantity == 60000
        assert matches[0].buy_price is None  # no shipments yet
        assert matches[0].sell_price is None

    def test_fifo_with_prices(self, db_session, seed_contracts, seed_curve, seed_formula):
        """FIFO with priced shipments."""
        buy, sell = seed_contracts

        # Create and price buy shipment
        ship_buy = Shipment(
            reference="SHP-M-001", contract_id=buy.id,
            bl_date="2025-01-15", bl_quantity=75000, status="DELIVERED",
        )
        db_session.add(ship_buy)
        db_session.flush()
        db_session.add(Assay(
            shipment_id=ship_buy.id, assay_type="PROVISIONAL",
            fe=62.0, moisture=7.5,
        ))
        db_session.commit()
        compute_provisional_price(db_session, ship_buy, buy)

        # Create and price sell shipment
        ship_sell = Shipment(
            reference="SHP-M-002", contract_id=sell.id,
            bl_date="2025-01-18", bl_quantity=60000, status="DELIVERED",
        )
        db_session.add(ship_sell)
        db_session.flush()
        db_session.add(Assay(
            shipment_id=ship_sell.id, assay_type="PROVISIONAL",
            fe=62.5, moisture=7.5,
        ))
        db_session.commit()
        compute_provisional_price(db_session, ship_sell, sell)

        matches = run_fifo_matching(db_session)
        assert len(matches) == 1
        assert matches[0].matched_quantity == 60000
        assert matches[0].buy_price is not None
        assert matches[0].sell_price is not None
        assert matches[0].realized_pnl is not None

    def test_fifo_re_run_clears(self, db_session, seed_contracts):
        """Re-running FIFO clears previous matches."""
        run_fifo_matching(db_session)
        assert db_session.query(Match).count() == 1

        run_fifo_matching(db_session)
        assert db_session.query(Match).count() == 1  # not 2

    def test_unwind(self, db_session, seed_contracts):
        """Unwind deletes all matches."""
        run_fifo_matching(db_session)
        assert db_session.query(Match).count() == 1
        count = unwind_all(db_session)
        assert count == 1
        assert db_session.query(Match).count() == 0


class TestManualMatch:
    def test_manual_match(self, db_session, seed_contracts):
        buy, sell = seed_contracts
        m = create_manual_match(db_session, buy.id, sell.id, 30000, "2025-01-20")
        assert m.matched_quantity == 30000
        assert m.buy_contract_id == buy.id
        assert m.sell_contract_id == sell.id
