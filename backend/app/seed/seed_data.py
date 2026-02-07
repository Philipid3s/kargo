"""Seed data for end-to-end validation.

Creates:
- TSI 62 Fe curve with 30 days of prices
- Pricing formula with Fe/moisture/impurity adjustments
- 2 BUY + 1 SELL contracts
- Shipments with BL dates
- Provisional + final assays

Run: python -m app.seed.seed_data
"""

from datetime import date, timedelta

from app.database import SessionLocal, Base, engine
from app.models import (
    PriceCurve, CurveData, PricingFormula, FormulaAdjustment,
    Contract, Shipment, Assay,
)


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(PriceCurve).first():
            print("Database already seeded. Skipping.")
            return

        # --- 1. Price Curve: TSI 62 Fe ---
        tsi = PriceCurve(code="TSI_62", name="TSI Iron Ore 62% Fe CFR China", currency="USD", uom="DMT")
        db.add(tsi)
        db.flush()

        # 30 days of prices: base ~108, some variation
        base_prices = [
            108.50, 109.00, 108.75, 109.25, 109.50,
            110.00, 110.25, 109.75, 109.50, 110.00,
            110.50, 111.00, 110.75, 110.50, 111.25,
            111.50, 111.00, 110.75, 111.00, 111.50,
            112.00, 112.25, 111.75, 111.50, 112.00,
            112.50, 112.00, 111.75, 112.25, 112.50,
        ]
        start_date = date(2025, 1, 1)
        snapshot = date(2025, 1, 31).isoformat()

        for i, price in enumerate(base_prices):
            d = start_date + timedelta(days=i)
            db.add(CurveData(
                curve_id=tsi.id,
                price_date=d.isoformat(),
                price=price,
                snapshot_date=snapshot,
            ))

        # --- 2. Pricing Formula ---
        formula = PricingFormula(
            name="Standard IO 62 CFR",
            curve_id=tsi.id,
            basis_fe=62.0,
            fe_rate_per_pct=1.50,
            moisture_threshold=8.0,
            moisture_penalty_per_pct=0.50,
            fixed_premium=1.00,
        )
        db.add(formula)
        db.flush()

        # Impurity adjustments
        adjustments = [
            FormulaAdjustment(formula_id=formula.id, element="SiO2", threshold=4.5, penalty_per_pct=1.00),
            FormulaAdjustment(formula_id=formula.id, element="Al2O3", threshold=2.5, penalty_per_pct=1.00),
            FormulaAdjustment(formula_id=formula.id, element="P", threshold=0.08, penalty_per_pct=3.00),
            FormulaAdjustment(formula_id=formula.id, element="S", threshold=0.02, penalty_per_pct=2.00),
        ]
        db.add_all(adjustments)

        # --- 3. Contracts ---
        buy1 = Contract(
            reference="BUY-2025-001",
            direction="BUY",
            counterparty="Vale International",
            commodity="Iron Ore Fines",
            quantity=75000,
            uom="DMT",
            incoterm="CFR",
            delivery_start="2025-01-15",
            delivery_end="2025-01-31",
            status="OPEN",
            qp_convention="MONTH_OF_BL",
            pricing_formula_id=formula.id,
        )
        buy2 = Contract(
            reference="BUY-2025-002",
            direction="BUY",
            counterparty="BHP Trading",
            commodity="Iron Ore Fines",
            quantity=50000,
            uom="DMT",
            incoterm="CFR",
            delivery_start="2025-01-20",
            delivery_end="2025-01-31",
            status="OPEN",
            qp_convention="MONTH_OF_BL",
            pricing_formula_id=formula.id,
        )
        sell1 = Contract(
            reference="SELL-2025-001",
            direction="SELL",
            counterparty="Baosteel Resources",
            commodity="Iron Ore Fines",
            quantity=60000,
            uom="DMT",
            incoterm="CFR",
            delivery_start="2025-01-18",
            delivery_end="2025-01-31",
            status="OPEN",
            qp_convention="MONTH_OF_BL",
            pricing_formula_id=formula.id,
        )
        db.add_all([buy1, buy2, sell1])
        db.flush()

        # --- 4. Shipments ---
        ship1 = Shipment(
            reference="SHP-2025-001",
            contract_id=buy1.id,
            vessel_name="MV Iron Glory",
            bl_date="2025-01-15",
            bl_quantity=75000,
            status="DELIVERED",
        )
        ship2 = Shipment(
            reference="SHP-2025-002",
            contract_id=buy2.id,
            vessel_name="MV Pacific Star",
            bl_date="2025-01-20",
            bl_quantity=50000,
            status="IN_TRANSIT",
        )
        ship3 = Shipment(
            reference="SHP-2025-003",
            contract_id=sell1.id,
            vessel_name="MV Orient Express",
            bl_date="2025-01-18",
            bl_quantity=60000,
            status="DELIVERED",
        )
        db.add_all([ship1, ship2, ship3])
        db.flush()

        # --- 5. Assays ---
        # Shipment 1: provisional + final
        db.add(Assay(
            shipment_id=ship1.id, assay_type="PROVISIONAL",
            fe=62.5, moisture=7.8, sio2=4.2, al2o3=2.3, p=0.07, s=0.015,
        ))
        db.add(Assay(
            shipment_id=ship1.id, assay_type="FINAL",
            fe=62.3, moisture=8.1, sio2=4.4, al2o3=2.4, p=0.075, s=0.018,
        ))

        # Shipment 2: provisional only
        db.add(Assay(
            shipment_id=ship2.id, assay_type="PROVISIONAL",
            fe=61.8, moisture=8.5, sio2=4.6, al2o3=2.6, p=0.09, s=0.022,
        ))

        # Shipment 3: provisional + final
        db.add(Assay(
            shipment_id=ship3.id, assay_type="PROVISIONAL",
            fe=62.8, moisture=7.5, sio2=4.0, al2o3=2.2, p=0.06, s=0.012,
        ))
        db.add(Assay(
            shipment_id=ship3.id, assay_type="FINAL",
            fe=62.6, moisture=7.6, sio2=4.1, al2o3=2.3, p=0.065, s=0.014,
        ))

        db.commit()
        print("Seed data created successfully!")
        print(f"  - Price curve: {tsi.code} ({len(base_prices)} data points)")
        print(f"  - Formula: {formula.name}")
        print(f"  - Contracts: BUY-2025-001, BUY-2025-002, SELL-2025-001")
        print(f"  - Shipments: SHP-2025-001, SHP-2025-002, SHP-2025-003")
        print(f"  - Assays: 5 total (3 provisional, 2 final)")

    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
