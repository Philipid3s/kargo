from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.pricing_formula import (
    PricingFormulaCreate,
    PricingFormulaUpdate,
    PricingFormulaOut,
    PriceBreakdown,
    FormulaEvaluateRequest,
)
from app.services import pricing_formula_service as svc

router = APIRouter(prefix="/api/v1/pricing-formulas", tags=["Pricing Formulas"])


@router.get("/", response_model=list[PricingFormulaOut])
def list_formulas(db: Session = Depends(get_db)):
    return svc.list_formulas(db)


@router.post("/", response_model=PricingFormulaOut, status_code=201)
def create_formula(data: PricingFormulaCreate, db: Session = Depends(get_db)):
    return svc.create_formula(db, data)


@router.get("/{formula_id}", response_model=PricingFormulaOut)
def get_formula(formula_id: int, db: Session = Depends(get_db)):
    return svc.get_formula(db, formula_id)


@router.patch("/{formula_id}", response_model=PricingFormulaOut)
def update_formula(formula_id: int, data: PricingFormulaUpdate, db: Session = Depends(get_db)):
    return svc.update_formula(db, formula_id, data)


@router.delete("/{formula_id}", status_code=204)
def delete_formula(formula_id: int, db: Session = Depends(get_db)):
    svc.delete_formula(db, formula_id)


@router.post("/{formula_id}/evaluate", response_model=PriceBreakdown)
def evaluate_formula(formula_id: int, req: FormulaEvaluateRequest, db: Session = Depends(get_db)):
    formula = svc.get_formula(db, formula_id)
    assay_values = {
        "sio2": req.sio2,
        "al2o3": req.al2o3,
        "p": req.p,
        "s": req.s,
    }
    return svc.evaluate_formula(
        formula=formula,
        qp_average=req.qp_average,
        fe=req.fe,
        moisture=req.moisture,
        assay_values=assay_values,
    )
