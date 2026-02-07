from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pnl import RealizedPnlItem, UnrealizedPnlItem, PnlSummary
from app.services import pnl_service as svc

router = APIRouter(prefix="/api/v1/pnl", tags=["P&L"])


@router.get("/summary", response_model=PnlSummary)
def get_pnl_summary(db: Session = Depends(get_db)):
    return svc.get_pnl_summary(db)


@router.get("/realized", response_model=list[RealizedPnlItem])
def get_realized_pnl(db: Session = Depends(get_db)):
    return svc.get_realized_pnl(db)


@router.get("/unrealized", response_model=list[UnrealizedPnlItem])
def get_unrealized_pnl(db: Session = Depends(get_db)):
    return svc.get_unrealized_pnl(db)
