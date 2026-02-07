from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.pricing_formula import PricingFormula, FormulaAdjustment
from app.schemas.pricing_formula import (
    PricingFormulaCreate,
    PricingFormulaUpdate,
    PriceBreakdown,
)


def list_formulas(db: Session) -> list[PricingFormula]:
    return db.query(PricingFormula).all()


def get_formula(db: Session, formula_id: int) -> PricingFormula:
    formula = db.query(PricingFormula).filter(PricingFormula.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Pricing formula not found")
    return formula


def create_formula(db: Session, data: PricingFormulaCreate) -> PricingFormula:
    adjustments_data = data.adjustments
    formula_dict = data.model_dump(exclude={"adjustments"})
    formula = PricingFormula(**formula_dict)
    db.add(formula)
    db.flush()

    for adj in adjustments_data:
        db.add(FormulaAdjustment(formula_id=formula.id, **adj.model_dump()))

    db.commit()
    db.refresh(formula)
    return formula


def update_formula(db: Session, formula_id: int, data: PricingFormulaUpdate) -> PricingFormula:
    formula = get_formula(db, formula_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(formula, field, value)
    db.commit()
    db.refresh(formula)
    return formula


def delete_formula(db: Session, formula_id: int) -> None:
    formula = get_formula(db, formula_id)
    db.delete(formula)
    db.commit()


def evaluate_formula(
    formula: PricingFormula,
    qp_average: float,
    fe: float | None = None,
    moisture: float | None = None,
    assay_values: dict[str, float | None] | None = None,
) -> PriceBreakdown:
    """Core formula evaluation logic.

    assay_values: dict of element -> actual value (e.g. {"sio2": 4.5, "al2o3": 2.1})
    """
    base_price = qp_average

    # Fe adjustment
    fe_adjustment = 0.0
    if fe is not None and formula.fe_rate_per_pct != 0:
        fe_adjustment = (fe - formula.basis_fe) * formula.fe_rate_per_pct

    # Moisture penalty
    moisture_penalty = 0.0
    if moisture is not None and formula.moisture_penalty_per_pct != 0:
        excess = max(0.0, moisture - formula.moisture_threshold)
        moisture_penalty = -(excess * formula.moisture_penalty_per_pct)

    # Impurity penalties from formula adjustments
    impurity_penalties: dict[str, float] = {}
    if assay_values:
        for adj in formula.adjustments:
            actual = assay_values.get(adj.element.lower())
            if actual is not None and actual > adj.threshold:
                penalty = -((actual - adj.threshold) * adj.penalty_per_pct)
                impurity_penalties[adj.element] = penalty

    fixed_premium = formula.fixed_premium

    total = (
        base_price
        + fe_adjustment
        + moisture_penalty
        + sum(impurity_penalties.values())
        + fixed_premium
    )

    return PriceBreakdown(
        base_price=round(base_price, 4),
        fe_adjustment=round(fe_adjustment, 4),
        moisture_penalty=round(moisture_penalty, 4),
        impurity_penalties={k: round(v, 4) for k, v in impurity_penalties.items()},
        fixed_premium=round(fixed_premium, 4),
        total_price=round(total, 4),
    )
