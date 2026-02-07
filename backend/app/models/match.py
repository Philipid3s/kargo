from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    buy_contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    sell_contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    matched_quantity = Column(Float, nullable=False)
    buy_price = Column(Float, nullable=True)
    sell_price = Column(Float, nullable=True)
    realized_pnl = Column(Float, nullable=True)
    match_date = Column(String, nullable=False)  # ISO date

    buy_contract = relationship("Contract", foreign_keys=[buy_contract_id])
    sell_contract = relationship("Contract", foreign_keys=[sell_contract_id])
