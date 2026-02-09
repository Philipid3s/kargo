# 05 — Pricing Formulas

## Description

Pricing formulas are **structured data** that define how to compute the price for a contract. They are not hardcoded logic — the formula engine interprets them dynamically.

## Fields

| Field                    | Type    | Description                                          | Required |
|--------------------------|---------|------------------------------------------------------|----------|
| formula_id               | PK      | Auto-generated unique identifier                     | Yes      |
| formula_name             | TEXT    | Human-readable name                                  | Yes      |
| base_curve_id            | FK      | Which price curve to use (e.g. TSI 62)               | Yes      |
| fe_basis_pct             | REAL    | Basis Fe % for adjustment (e.g. 62.0)                | Yes      |
| fe_adjustment_per_pct    | REAL    | USD premium/penalty per 1% Fe above/below basis      | Yes      |
| moisture_basis_pct       | REAL    | Moisture threshold % (e.g. 8.0)                      | Yes      |
| moisture_penalty_per_pct | REAL    | USD penalty per 1% moisture above threshold           | Yes      |
| sio2_basis_pct           | REAL    | SiO2 threshold %                                     | No       |
| sio2_penalty_per_pct     | REAL    | USD penalty per 1% SiO2 above threshold              | No       |
| al2o3_basis_pct          | REAL    | Al2O3 threshold %                                    | No       |
| al2o3_penalty_per_pct    | REAL    | USD penalty per 1% Al2O3 above threshold             | No       |
| p_basis_pct              | REAL    | Phosphorus threshold %                               | No       |
| p_penalty_per_pct        | REAL    | USD penalty per 1% P above threshold                 | No       |
| s_basis_pct              | REAL    | Sulphur threshold %                                  | No       |
| s_penalty_per_pct        | REAL    | USD penalty per 1% S above threshold                 | No       |
| fixed_premium_usd        | REAL    | Optional flat premium/discount in USD/DMT            | No       |

## Formula Evaluation Logic

Given: assay values + QP date range + curve data

```
Step 1: Compute QP Average
    qp_average = AVG(curve prices within QP date range)

Step 2: Fe Adjustment
    fe_adj = (assay_fe - fe_basis_pct) × fe_adjustment_per_pct
    → Positive if Fe above basis (premium), negative if below (penalty)

Step 3: Moisture Penalty
    IF assay_moisture > moisture_basis_pct:
        moisture_adj = -(assay_moisture - moisture_basis_pct) × moisture_penalty_per_pct
    ELSE:
        moisture_adj = 0

Step 4: Impurity Penalties (same pattern for SiO2, Al2O3, P, S)
    IF assay_value > basis_pct:
        penalty = -(assay_value - basis_pct) × penalty_per_pct
    ELSE:
        penalty = 0

Step 5: Fixed Premium/Discount
    fixed_adj = fixed_premium_usd (can be positive or negative)

Step 6: Final Computed Price
    price = qp_average + fe_adj + moisture_adj + impurity_penalties + fixed_adj
```

## Output: Price Breakdown

The formula engine must return a full breakdown:

| Component              | Value (USD/DMT) |
|------------------------|-----------------|
| QP Average (base)      | 120.50          |
| Fe Adjustment          | +1.80           |
| Moisture Penalty       | -0.45           |
| SiO2 Penalty           | -0.20           |
| Al2O3 Penalty          | 0.00            |
| P Penalty              | -0.10           |
| S Penalty              | 0.00            |
| Fixed Premium/Discount | +0.50           |
| **Final Price**        | **122.05**      |

## Business Rules

1. Formula is a reusable template — multiple contracts can share the same formula
2. All penalties are applied only when the assay value **exceeds** the basis threshold
3. Fe adjustment is **bidirectional** (premium above basis, penalty below)
4. Moisture and impurity adjustments are **penalties only** (no premium for being under)
5. The formula references a curve — the QP rule comes from the **contract**, not the formula
6. The formula engine must be deterministic: same inputs → same output
