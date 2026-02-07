from sqlalchemy import Column, Integer, String, Float, ForeignKey, CheckConstraint
from sqlalchemy.orm import relationship

from app.database import Base


class Shipment(Base):
    __tablename__ = "shipments"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id"), nullable=False)
    vessel_name = Column(String, nullable=True)
    bl_date = Column(String, nullable=True)       # bill of lading date (ISO)
    bl_quantity = Column(Float, nullable=True)     # actual BL quantity
    status = Column(String, nullable=False, default="PLANNED")

    # Cached pricing (denormalized for audit trail)
    provisional_price = Column(Float, nullable=True)
    final_price = Column(Float, nullable=True)
    pnf_amount = Column(Float, nullable=True)  # P&F settlement amount

    contract = relationship("Contract", back_populates="shipments")
    assays = relationship("Assay", back_populates="shipment", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(
            "status IN ('PLANNED', 'IN_TRANSIT', 'DELIVERED', 'COMPLETED', 'CANCELLED')",
            name="ck_shipment_status",
        ),
    )
