"""Tests for the pricing service — the most critical business logic."""

from datetime import date
from calendar import monthrange

import pytest

from app.services.pricing_service import resolve_qp_dates, compute_provisional_price, compute_final_price
from app.services.pricing_formula_service import evaluate_formula
from app.models.shipment import Shipment
from app.models.assay import Assay


class TestQPResolution:
    def test_month_of_bl(self):
        start, end = resolve_qp_dates("MONTH_OF_BL", "2025-01-15")
        assert start == "2025-01-01"
        assert end == "2025-01-31"

    def test_month_of_bl_february(self):
        start, end = resolve_qp_dates("MONTH_OF_BL", "2025-02-10")
        assert start == "2025-02-01"
        assert end == "2025-02-28"

    def test_month_prior_bl(self):
        start, end = resolve_qp_dates("MONTH_PRIOR_BL", "2025-02-15")
        assert start == "2025-01-01"
        assert end == "2025-01-31"

    def test_month_after_bl(self):
        start, end = resolve_qp_dates("MONTH_AFTER_BL", "2025-01-15")
        assert start == "2025-02-01"
        assert end == "2025-02-28"

    def test_custom(self):
        start, end = resolve_qp_dates("CUSTOM", "2025-01-15", -5, 10)
        assert start == "2025-01-10"
        assert end == "2025-01-25"

    def test_custom_missing_offsets(self):
        with pytest.raises(Exception):  # HTTPException
            resolve_qp_dates("CUSTOM", "2025-01-15")


class TestFormulaEvaluation:
    def test_base_only(self, seed_formula, db_session):
        result = evaluate_formula(seed_formula, qp_average=110.0)
        # Base + fixed premium only
        assert result.base_price == 110.0
        assert result.fe_adjustment == 0.0
        assert result.moisture_penalty == 0.0
        assert result.fixed_premium == 1.0
        assert result.total_price == 111.0

    def test_fe_above_basis(self, seed_formula, db_session):
        result = evaluate_formula(seed_formula, qp_average=110.0, fe=63.0)
        # Fe: (63 - 62) × 1.50 = 1.50
        assert result.fe_adjustment == 1.50
        assert result.total_price == 112.50  # 110 + 1.5 + 0 + 1.0

    def test_fe_below_basis(self, seed_formula, db_session):
        result = evaluate_formula(seed_formula, qp_average=110.0, fe=61.0)
        # Fe: (61 - 62) × 1.50 = -1.50
        assert result.fe_adjustment == -1.50
        assert result.total_price == 109.50

    def test_moisture_above_threshold(self, seed_formula, db_session):
        result = evaluate_formula(seed_formula, qp_average=110.0, moisture=9.0)
        # Moisture: -(max(0, 9-8) × 0.50) = -0.50
        assert result.moisture_penalty == -0.50
        assert result.total_price == 110.50  # 110 - 0.5 + 1.0

    def test_moisture_below_threshold(self, seed_formula, db_session):
        result = evaluate_formula(seed_formula, qp_average=110.0, moisture=7.0)
        assert result.moisture_penalty == 0.0

    def test_impurity_penalties(self, seed_formula, db_session):
        result = evaluate_formula(
            seed_formula,
            qp_average=110.0,
            assay_values={"sio2": 5.0, "p": 0.10},
        )
        # SiO2: -(5.0 - 4.5) × 1.0 = -0.50
        # P: -(0.10 - 0.08) × 3.0 = -0.06
        assert result.impurity_penalties["SiO2"] == -0.5
        assert result.impurity_penalties["P"] == -0.06
        assert result.total_price == pytest.approx(110.44, abs=0.01)

    def test_full_evaluation(self, seed_formula, db_session):
        result = evaluate_formula(
            seed_formula,
            qp_average=110.0,
            fe=62.5,
            moisture=8.5,
            assay_values={"sio2": 5.0, "p": 0.10},
        )
        # Base: 110.0
        # Fe: (62.5 - 62) × 1.50 = 0.75
        # Moisture: -(0.5) × 0.50 = -0.25
        # SiO2: -0.50
        # P: -0.06
        # Premium: 1.00
        expected = 110.0 + 0.75 - 0.25 - 0.50 - 0.06 + 1.00
        assert result.total_price == pytest.approx(expected, abs=0.01)


class TestProvisionalPricing:
    def test_compute_provisional(self, db_session, seed_contracts, seed_curve, seed_formula):
        buy, _ = seed_contracts

        shipment = Shipment(
            reference="SHP-001",
            contract_id=buy.id,
            bl_date="2025-01-15",
            bl_quantity=75000,
            status="DELIVERED",
        )
        db_session.add(shipment)
        db_session.flush()

        assay = Assay(
            shipment_id=shipment.id,
            assay_type="PROVISIONAL",
            fe=62.5, moisture=7.8, sio2=4.2, al2o3=2.3, p=0.07, s=0.015,
        )
        db_session.add(assay)
        db_session.commit()

        price, breakdown = compute_provisional_price(db_session, shipment, buy)

        assert price > 0
        assert breakdown.base_price > 0
        assert shipment.provisional_price == price


class TestFinalPricingAndPnF:
    def test_compute_final_and_pnf(self, db_session, seed_contracts, seed_curve, seed_formula):
        buy, _ = seed_contracts

        shipment = Shipment(
            reference="SHP-002",
            contract_id=buy.id,
            bl_date="2025-01-15",
            bl_quantity=75000,
            status="DELIVERED",
        )
        db_session.add(shipment)
        db_session.flush()

        # Provisional assay
        db_session.add(Assay(
            shipment_id=shipment.id, assay_type="PROVISIONAL",
            fe=62.5, moisture=7.8, sio2=4.2, al2o3=2.3, p=0.07, s=0.015,
        ))
        db_session.commit()

        # Compute provisional first
        compute_provisional_price(db_session, shipment, buy)
        prov_price = shipment.provisional_price

        # Final assay (slightly different)
        db_session.add(Assay(
            shipment_id=shipment.id, assay_type="FINAL",
            fe=62.3, moisture=8.1, sio2=4.4, al2o3=2.4, p=0.075, s=0.018,
        ))
        db_session.commit()

        final_price, breakdown, pnf = compute_final_price(db_session, shipment, buy)

        assert final_price > 0
        assert shipment.final_price == final_price
        assert pnf is not None
        # P&F = (final - provisional) × qty
        expected_pnf = round((final_price - prov_price) * 75000, 2)
        assert pnf == expected_pnf
