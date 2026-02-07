from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contract import Contract
from app.models.shipment import Shipment
from app.schemas.dashboard import DashboardSummary
from app.services import exposure_service, pnl_service

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard(db: Session = Depends(get_db)):
    total_contracts = db.query(Contract).count()
    open_contracts = db.query(Contract).filter(Contract.status.in_(["OPEN", "EXECUTED"])).count()
    total_shipments = db.query(Shipment).count()
    active_shipments = db.query(Shipment).filter(
        Shipment.status.in_(["PLANNED", "IN_TRANSIT", "DELIVERED"])
    ).count()

    exposure = exposure_service.compute_exposure(db)
    pnl = pnl_service.get_pnl_summary(db)

    return DashboardSummary(
        total_contracts=total_contracts,
        open_contracts=open_contracts,
        total_shipments=total_shipments,
        active_shipments=active_shipments,
        exposure=exposure,
        pnl=pnl,
    )
