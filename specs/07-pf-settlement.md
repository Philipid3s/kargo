# 07 — Provisional & Final Pricing (P&F Settlement)

## Description

This is the standard Iron Ore settlement workflow. A shipment is first priced provisionally (at loading), then repriced finally (at discharge). The difference triggers a Price & Freight (P&F) settlement.

## Workflow

```
1. Provisional Assay arrives
   → Compute Provisional Price using formula + provisional assay + QP curve prices
   → Store provisional price breakdown

2. Final Assay arrives
   → Compute Final Price using formula + final assay + QP curve prices
   → Store final price breakdown

3. P&F Settlement
   → P&F Adjustment = (Final Price - Provisional Price) × BL Quantity
   → Positive = additional payment due
   → Negative = credit / refund due
```

## Stored Data: Shipment Price Record

| Field                 | Type      | Description                                    |
|-----------------------|-----------|------------------------------------------------|
| shipment_price_id     | PK        | Auto-generated unique identifier               |
| shipment_id           | FK        | Parent shipment                                |
| price_type            | ENUM      | `PROVISIONAL` or `FINAL`                       |
| qp_start              | DATE      | Start of QP range used                         |
| qp_end                | DATE      | End of QP range used                           |
| qp_average_price      | REAL      | Average curve price over QP                    |
| fe_adjustment          | REAL      | Fe premium/penalty (USD/DMT)                   |
| moisture_adjustment    | REAL      | Moisture penalty (USD/DMT)                     |
| sio2_adjustment        | REAL      | SiO2 penalty (USD/DMT)                         |
| al2o3_adjustment       | REAL      | Al2O3 penalty (USD/DMT)                        |
| p_adjustment           | REAL      | Phosphorus penalty (USD/DMT)                   |
| s_adjustment           | REAL      | Sulphur penalty (USD/DMT)                      |
| fixed_adjustment       | REAL      | Fixed premium/discount (USD/DMT)               |
| computed_price         | REAL      | Total computed price (USD/DMT)                 |
| total_value            | REAL      | computed_price × BL quantity (USD)             |
| computed_at            | DATETIME  | When the computation was performed             |

## P&F Settlement Record

| Field                 | Type      | Description                                    |
|-----------------------|-----------|------------------------------------------------|
| pf_settlement_id      | PK        | Auto-generated unique identifier               |
| shipment_id           | FK        | Parent shipment                                |
| provisional_price     | REAL      | Provisional price (USD/DMT)                    |
| final_price           | REAL      | Final price (USD/DMT)                          |
| price_difference      | REAL      | final_price - provisional_price (USD/DMT)      |
| bl_quantity_dmt       | REAL      | BL quantity used for settlement                |
| settlement_amount     | REAL      | price_difference × bl_quantity_dmt (USD)       |
| settlement_direction  | TEXT      | `PAYABLE` or `RECEIVABLE`                      |
| computed_at           | DATETIME  | When the settlement was computed               |

## Business Rules

1. Provisional price can only be computed if a **provisional assay** exists
2. Final price can only be computed if a **final assay** exists
3. P&F settlement requires **both** provisional and final prices to exist
4. A shipment has at most **one** provisional price and **one** final price
5. Uniqueness: `(shipment_id, price_type)` must be unique
6. The QP date range is derived from the **contract's QP convention** and the **shipment's BL date**
7. If the QP is the same for both provisional and final, only the assay values change the price
8. `settlement_amount > 0` → buyer owes seller additional payment
9. `settlement_amount < 0` → seller owes buyer a credit

## Calculation Example

```
Contract: Buy, QP = MONTH_OF_BL, Formula = TSI62 + Fe adj + moisture adj
Shipment: BL date = 2024-03-15, BL qty = 50,000 DMT
QP range: 2024-03-01 to 2024-03-31

Provisional Assay: Fe=63.2%, Moisture=8.5%
  → QP Average: $120.50
  → Fe Adj: (63.2 - 62.0) × $1.50 = +$1.80
  → Moisture: (8.5 - 8.0) × $0.90 = -$0.45
  → Provisional Price = $121.85/DMT
  → Provisional Value = $121.85 × 50,000 = $6,092,500

Final Assay: Fe=62.8%, Moisture=8.8%
  → QP Average: $120.50 (same QP)
  → Fe Adj: (62.8 - 62.0) × $1.50 = +$1.20
  → Moisture: (8.8 - 8.0) × $0.90 = -$0.72
  → Final Price = $120.98/DMT
  → Final Value = $120.98 × 50,000 = $6,049,000

P&F Settlement:
  → Difference = $120.98 - $121.85 = -$0.87/DMT
  → Settlement = -$0.87 × 50,000 = -$43,500
  → Direction: RECEIVABLE (buyer gets credit)
```
