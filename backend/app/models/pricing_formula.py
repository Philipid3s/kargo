from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class PricingFormula(Base):
    __tablename__ = "pricing_formulas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    curve_id = Column(Integer, ForeignKey("price_curves.id"), nullable=False)

    # Fe adjustment
    basis_fe = Column(Float, nullable=False, default=62.0)
    fe_rate_per_pct = Column(Float, nullable=False, default=0.0)  # USD per 1% Fe

    # Moisture penalty
    moisture_threshold = Column(Float, nullable=False, default=8.0)  # %
    moisture_penalty_per_pct = Column(Float, nullable=False, default=0.0)  # USD per 1% above threshold

    # Fixed premium/discount
    fixed_premium = Column(Float, nullable=False, default=0.0)

    curve = relationship("PriceCurve")
    adjustments = relationship("FormulaAdjustment", back_populates="formula", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="pricing_formula")


class FormulaAdjustment(Base):
    __tablename__ = "formula_adjustments"

    id = Column(Integer, primary_key=True, index=True)
    formula_id = Column(Integer, ForeignKey("pricing_formulas.id", ondelete="CASCADE"), nullable=False)
    element = Column(String, nullable=False)  # SiO2, Al2O3, P, S
    threshold = Column(Float, nullable=False)  # penalty kicks in above this
    penalty_per_pct = Column(Float, nullable=False)  # USD per 1% above threshold

    formula = relationship("PricingFormula", back_populates="adjustments")

    __table_args__ = (
        UniqueConstraint("formula_id", "element", name="uq_formula_element"),
    )
