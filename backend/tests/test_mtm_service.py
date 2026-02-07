"""Tests for mark-to-market service."""

from app.services.mtm_service import run_mtm_for_contract, run_mtm_portfolio
from app.services.pricing_service import compute_provisional_price
from app.models.shipment import Shipment
from app.models.assay import Assay


class TestMTM:
    def test_mtm_no_shipments(self, db_session, seed_contracts, seed_curve):
        """MTM with no shipments — contract price is None, MTM = 0."""
        buy, _ = seed_contracts
        record = run_mtm_for_contract(db_session, buy.id, "2025-01-15", "2025-01-31")
        assert record.open_quantity == 75000
        assert record.mtm_value == 0  # no contract price

    def test_mtm_with_provisional(self, db_session, seed_contracts, seed_curve, seed_formula):
        """MTM with provisional pricing."""
        buy, _ = seed_contracts

        # Create shipment with provisional assay
        shipment = Shipment(
            reference="SHP-MTM-001", contract_id=buy.id,
            bl_date="2025-01-15", bl_quantity=50000, status="DELIVERED",
        )
        db_session.add(shipment)
        db_session.flush()
        db_session.add(Assay(
            shipment_id=shipment.id, assay_type="PROVISIONAL",
            fe=62.0, moisture=7.5,
        ))
        db_session.commit()

        compute_provisional_price(db_session, shipment, buy)

        # Run MTM — open qty should be 75000 - 50000 = 25000
        record = run_mtm_for_contract(db_session, buy.id, "2025-01-15", "2025-01-31")
        assert record.open_quantity == 25000
        assert record.contract_price is not None
        assert record.direction == "BUY"

    def test_mtm_portfolio(self, db_session, seed_contracts, seed_curve):
        """Portfolio MTM across all contracts."""
        result = run_mtm_portfolio(db_session, "2025-01-15", "2025-01-31")
        assert len(result.records) == 2  # BUY + SELL
        assert isinstance(result.total_mtm, float)

    def test_mtm_zero_open_qty(self, db_session, seed_contracts, seed_curve):
        """Fully shipped contract has 0 open qty."""
        buy, _ = seed_contracts

        shipment = Shipment(
            reference="SHP-MTM-002", contract_id=buy.id,
            bl_date="2025-01-15", bl_quantity=75000, status="DELIVERED",
        )
        db_session.add(shipment)
        db_session.commit()

        record = run_mtm_for_contract(db_session, buy.id, "2025-01-15", "2025-01-31")
        assert record.open_quantity == 0
        assert record.mtm_value == 0
