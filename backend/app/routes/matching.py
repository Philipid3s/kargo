from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.match import MatchCreate, MatchOut
from app.services import matching_service as svc

router = APIRouter(prefix="/api/v1/matching", tags=["Matching"])


@router.post("/fifo", response_model=list[MatchOut])
def run_fifo(db: Session = Depends(get_db)):
    return svc.run_fifo_matching(db)


@router.post("/manual", response_model=MatchOut, status_code=201)
def create_manual_match(data: MatchCreate, db: Session = Depends(get_db)):
    return svc.create_manual_match(
        db, data.buy_contract_id, data.sell_contract_id, data.matched_quantity, data.match_date,
    )


@router.get("/", response_model=list[MatchOut])
def list_matches(db: Session = Depends(get_db)):
    return svc.list_matches(db)


@router.delete("/{match_id}", status_code=204)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    svc.delete_match(db, match_id)


@router.delete("/", status_code=200)
def unwind_all(db: Session = Depends(get_db)):
    count = svc.unwind_all(db)
    return {"deleted": count}
