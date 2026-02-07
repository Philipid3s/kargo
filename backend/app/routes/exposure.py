from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.exposure import ExposureSummary
from app.services import exposure_service as svc

router = APIRouter(prefix="/api/v1/exposure", tags=["Exposure"])


@router.get("/", response_model=ExposureSummary)
def get_exposure(db: Session = Depends(get_db)):
    return svc.compute_exposure(db)
