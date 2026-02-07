from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Assay(Base):
    __tablename__ = "assays"

    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id", ondelete="CASCADE"), nullable=False)
    assay_type = Column(String, nullable=False)  # PROVISIONAL or FINAL

    fe = Column(Float, nullable=True)        # Fe %
    moisture = Column(Float, nullable=True)   # Moisture %
    sio2 = Column(Float, nullable=True)       # SiO2 %
    al2o3 = Column(Float, nullable=True)      # Al2O3 %
    p = Column(Float, nullable=True)          # Phosphorus %
    s = Column(Float, nullable=True)          # Sulphur %

    shipment = relationship("Shipment", back_populates="assays")

    __table_args__ = (
        UniqueConstraint("shipment_id", "assay_type", name="uq_shipment_assay_type"),
        CheckConstraint("assay_type IN ('PROVISIONAL', 'FINAL')", name="ck_assay_type"),
    )
