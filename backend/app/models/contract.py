from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, nullable=False)
    direction = Column(String, nullable=False)  # BUY or SELL
    counterparty = Column(String, nullable=False)
    commodity = Column(String, nullable=False, default="Iron Ore Fines")
    quantity = Column(Float, nullable=False)  # MT
    uom = Column(String, nullable=False, default="DMT")
    incoterm = Column(String, nullable=False, default="CFR")
    delivery_start = Column(String, nullable=False)  # ISO date
    delivery_end = Column(String, nullable=False)
    status = Column(String, nullable=False, default="OPEN")  # OPEN, EXECUTED, CLOSED, CANCELLED

    # QP convention
    qp_convention = Column(String, nullable=False, default="MONTH_OF_BL")
    qp_start_offset = Column(Integer, nullable=True)  # days, for CUSTOM
    qp_end_offset = Column(Integer, nullable=True)

    # Pricing
    pricing_formula_id = Column(Integer, ForeignKey("pricing_formulas.id"), nullable=False)

    pricing_formula = relationship("PricingFormula", back_populates="contracts")
    shipments = relationship("Shipment", back_populates="contract", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("direction IN ('BUY', 'SELL')", name="ck_contract_direction"),
        CheckConstraint("status IN ('OPEN', 'EXECUTED', 'CLOSED', 'CANCELLED')", name="ck_contract_status"),
        CheckConstraint(
            "qp_convention IN ('MONTH_OF_BL', 'MONTH_PRIOR_BL', 'MONTH_AFTER_BL', 'CUSTOM')",
            name="ck_qp_convention",
        ),
    )
