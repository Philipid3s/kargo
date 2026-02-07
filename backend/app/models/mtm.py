from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class MtmRecord(Base):
    __tablename__ = "mtm_history"

    id = Column(Integer, primary_key=True, index=True)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    valuation_date = Column(String, nullable=False)  # ISO date

    # Snapshot of values at valuation time
    curve_price = Column(Float, nullable=False)      # market price from curve
    contract_price = Column(Float, nullable=True)     # weighted avg of shipment prices
    open_quantity = Column(Float, nullable=False)
    direction = Column(String, nullable=False)        # BUY or SELL
    mtm_value = Column(Float, nullable=False)         # computed MTM

    contract = relationship("Contract")
