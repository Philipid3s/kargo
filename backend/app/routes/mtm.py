from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.mtm import MtmRunRequest, MtmRecordOut, MtmPortfolioOut
from app.services import mtm_service as svc

router = APIRouter(prefix="/api/v1/mtm", tags=["Mark-to-Market"])


@router.post("/run", response_model=MtmPortfolioOut)
def run_mtm_portfolio(req: MtmRunRequest, db: Session = Depends(get_db)):
    return svc.run_mtm_portfolio(db, req.valuation_date, req.snapshot_date)


@router.post("/run/{contract_id}", response_model=MtmRecordOut)
def run_mtm_contract(contract_id: int, req: MtmRunRequest, db: Session = Depends(get_db)):
    return svc.run_mtm_for_contract(db, contract_id, req.valuation_date, req.snapshot_date)


@router.get("/history", response_model=list[MtmRecordOut])
def get_mtm_history(
    contract_id: int | None = Query(None),
    valuation_date: str | None = Query(None),
    db: Session = Depends(get_db),
):
    return svc.get_mtm_history(db, contract_id, valuation_date)


@router.get("/portfolio", response_model=MtmPortfolioOut)
def get_portfolio_mtm(valuation_date: str = Query(...), db: Session = Depends(get_db)):
    """Get previously computed MTM for a specific date, or compute fresh."""
    existing = svc.get_mtm_history(db, valuation_date=valuation_date)
    if existing:
        total = sum(r.mtm_value for r in existing)
        return MtmPortfolioOut(
            valuation_date=valuation_date,
            records=[MtmRecordOut.model_validate(r) for r in existing],
            total_mtm=round(total, 2),
        )
    return svc.run_mtm_portfolio(db, valuation_date)
