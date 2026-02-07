import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.database import Base, get_db
from app.main import app


@pytest.fixture(scope="function")
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, connection_record):
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    def _override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def seed_curve(db_session):
    """Create a TSI 62 curve with 30 days of prices for January 2025."""
    from app.models.price_curve import PriceCurve, CurveData
    from datetime import date, timedelta

    curve = PriceCurve(code="TSI_62", name="TSI 62 Fe", currency="USD", uom="DMT")
    db_session.add(curve)
    db_session.flush()

    prices = [
        108.50, 109.00, 108.75, 109.25, 109.50,
        110.00, 110.25, 109.75, 109.50, 110.00,
        110.50, 111.00, 110.75, 110.50, 111.25,
        111.50, 111.00, 110.75, 111.00, 111.50,
        112.00, 112.25, 111.75, 111.50, 112.00,
        112.50, 112.00, 111.75, 112.25, 112.50,
    ]
    start = date(2025, 1, 1)
    snapshot = "2025-01-31"
    for i, p in enumerate(prices):
        db_session.add(CurveData(
            curve_id=curve.id,
            price_date=(start + timedelta(days=i)).isoformat(),
            price=p,
            snapshot_date=snapshot,
        ))
    db_session.commit()
    return curve


@pytest.fixture
def seed_formula(db_session, seed_curve):
    """Create a standard IO formula."""
    from app.models.pricing_formula import PricingFormula, FormulaAdjustment

    formula = PricingFormula(
        name="Standard IO 62",
        curve_id=seed_curve.id,
        basis_fe=62.0,
        fe_rate_per_pct=1.50,
        moisture_threshold=8.0,
        moisture_penalty_per_pct=0.50,
        fixed_premium=1.00,
    )
    db_session.add(formula)
    db_session.flush()

    db_session.add(FormulaAdjustment(formula_id=formula.id, element="SiO2", threshold=4.5, penalty_per_pct=1.0))
    db_session.add(FormulaAdjustment(formula_id=formula.id, element="P", threshold=0.08, penalty_per_pct=3.0))
    db_session.commit()
    return formula


@pytest.fixture
def seed_contracts(db_session, seed_formula):
    """Create a BUY and SELL contract."""
    from app.models.contract import Contract

    buy = Contract(
        reference="BUY-001",
        direction="BUY",
        counterparty="Vale",
        quantity=75000,
        delivery_start="2025-01-15",
        delivery_end="2025-01-31",
        qp_convention="MONTH_OF_BL",
        pricing_formula_id=seed_formula.id,
    )
    sell = Contract(
        reference="SELL-001",
        direction="SELL",
        counterparty="Baosteel",
        quantity=60000,
        delivery_start="2025-01-18",
        delivery_end="2025-01-31",
        qp_convention="MONTH_OF_BL",
        pricing_formula_id=seed_formula.id,
    )
    db_session.add_all([buy, sell])
    db_session.commit()
    return buy, sell
