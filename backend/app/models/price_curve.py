from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class PriceCurve(Base):
    __tablename__ = "price_curves"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, nullable=False)  # e.g. "TSI_62"
    name = Column(String, nullable=False)
    currency = Column(String, nullable=False, default="USD")
    uom = Column(String, nullable=False, default="DMT")  # dry metric ton

    data_points = relationship("CurveData", back_populates="curve", cascade="all, delete-orphan")


class CurveData(Base):
    __tablename__ = "curve_data"

    id = Column(Integer, primary_key=True, index=True)
    curve_id = Column(Integer, ForeignKey("price_curves.id", ondelete="CASCADE"), nullable=False)
    price_date = Column(String, nullable=False)      # ISO-8601 date
    price = Column(Float, nullable=False)
    snapshot_date = Column(String, nullable=False)    # for MTM re-runs

    curve = relationship("PriceCurve", back_populates="data_points")

    __table_args__ = (
        UniqueConstraint("curve_id", "price_date", "snapshot_date", name="uq_curve_date_snapshot"),
    )
