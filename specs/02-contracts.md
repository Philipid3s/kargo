# 02 — Contract Management

## Description

Contracts represent physical Iron Ore trade agreements (Buy or Sell).

## Fields

| Field               | Type        | Description                              | Required |
|---------------------|-------------|------------------------------------------|----------|
| contract_id         | PK          | Auto-generated unique identifier         | Yes      |
| direction           | ENUM        | `BUY` or `SELL`                          | Yes      |
| counterparty        | TEXT        | Name of trading counterparty             | Yes      |
| quantity_dmt        | REAL        | Contracted quantity in DMT               | Yes      |
| delivery_start      | DATE        | Start of delivery window                 | Yes      |
| delivery_end        | DATE        | End of delivery window                   | Yes      |
| incoterms           | ENUM        | `CFR`, `CIF`, or `FOB`                   | Yes      |
| load_port           | TEXT        | Port of loading                          | Yes      |
| discharge_port      | TEXT        | Port of discharge                        | Yes      |
| quality_fe_pct      | REAL        | Basis Fe % (e.g. 62.0)                   | Yes      |
| quality_moisture_pct| REAL        | Basis moisture % (e.g. 8.0)             | Yes      |
| quality_sio2_pct    | REAL        | Basis SiO2 %                             | No       |
| quality_al2o3_pct   | REAL        | Basis Al2O3 %                            | No       |
| quality_p_pct       | REAL        | Basis Phosphorus %                       | No       |
| quality_s_pct       | REAL        | Basis Sulphur %                          | No       |
| pricing_formula_id  | FK          | Link to pricing formula                  | Yes      |
| qp_convention       | ENUM        | `MONTH_OF_BL`, `MONTH_PRIOR_BL`, `MONTH_AFTER_BL`, `CUSTOM` | Yes |
| qp_custom_start     | INTEGER     | Offset days before BL (if CUSTOM)        | No       |
| qp_custom_end       | INTEGER     | Offset days after BL (if CUSTOM)         | No       |
| status              | ENUM        | `DRAFT`, `CONFIRMED`, `EXECUTED`, `CLOSED` | Yes    |
| created_at          | DATETIME    | Record creation timestamp                | Yes      |
| updated_at          | DATETIME    | Last update timestamp                    | Yes      |

## Business Rules

1. A contract must have a valid pricing formula reference
2. `delivery_end` must be >= `delivery_start`
3. `quantity_dmt` must be > 0
4. QP custom offsets are required only when `qp_convention = 'CUSTOM'`
5. Status transitions: `DRAFT → CONFIRMED → EXECUTED → CLOSED`
6. A contract can have **one or multiple shipments** (partial shipments)
7. Total shipped quantity (sum of BL quantities) should not exceed contracted quantity

## Computed Fields (not stored, derived at query time)

- **shipped_quantity**: sum of BL quantities from associated shipments
- **open_quantity**: `quantity_dmt - shipped_quantity`
- **is_fully_shipped**: `open_quantity <= 0`
