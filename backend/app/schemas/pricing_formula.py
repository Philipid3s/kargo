from pydantic import BaseModel


# --- FormulaAdjustment ---
class FormulaAdjustmentCreate(BaseModel):
    element: str
    threshold: float
    penalty_per_pct: float


class FormulaAdjustmentOut(BaseModel):
    id: int
    formula_id: int
    element: str
    threshold: float
    penalty_per_pct: float

    model_config = {"from_attributes": True}


# --- PricingFormula ---
class PricingFormulaCreate(BaseModel):
    name: str
    curve_id: int
    basis_fe: float = 62.0
    fe_rate_per_pct: float = 0.0
    moisture_threshold: float = 8.0
    moisture_penalty_per_pct: float = 0.0
    fixed_premium: float = 0.0
    adjustments: list[FormulaAdjustmentCreate] = []


class PricingFormulaUpdate(BaseModel):
    name: str | None = None
    curve_id: int | None = None
    basis_fe: float | None = None
    fe_rate_per_pct: float | None = None
    moisture_threshold: float | None = None
    moisture_penalty_per_pct: float | None = None
    fixed_premium: float | None = None


class PricingFormulaOut(BaseModel):
    id: int
    name: str
    curve_id: int
    basis_fe: float
    fe_rate_per_pct: float
    moisture_threshold: float
    moisture_penalty_per_pct: float
    fixed_premium: float
    adjustments: list[FormulaAdjustmentOut] = []

    model_config = {"from_attributes": True}


class PriceBreakdown(BaseModel):
    base_price: float
    fe_adjustment: float
    moisture_penalty: float
    impurity_penalties: dict[str, float]
    fixed_premium: float
    total_price: float


class FormulaEvaluateRequest(BaseModel):
    qp_average: float
    fe: float | None = None
    moisture: float | None = None
    sio2: float | None = None
    al2o3: float | None = None
    p: float | None = None
    s: float | None = None
