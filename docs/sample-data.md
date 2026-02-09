# Sample Data — For Testing & Validation

## Price Curve: TSI 62% Fe CFR China (March 2024)

| Date       | Price (USD/DMT) |
|------------|-----------------|
| 2024-03-01 | 118.50          |
| 2024-03-04 | 119.25          |
| 2024-03-05 | 120.00          |
| 2024-03-06 | 119.75          |
| 2024-03-07 | 121.00          |
| 2024-03-08 | 121.50          |
| 2024-03-11 | 122.00          |
| 2024-03-12 | 121.25          |
| 2024-03-13 | 120.50          |
| 2024-03-14 | 119.80          |
| 2024-03-15 | 120.75          |
| 2024-03-18 | 121.50          |
| 2024-03-19 | 122.25          |
| 2024-03-20 | 121.00          |
| 2024-03-21 | 120.50          |
| 2024-03-22 | 119.75          |
| 2024-03-25 | 120.00          |
| 2024-03-26 | 120.50          |
| 2024-03-27 | 121.25          |
| 2024-03-28 | 121.75          |

**March average (20 business days): ~120.54 USD/DMT**

## Pricing Formula: "Standard TSI62 Iron Ore"

| Parameter                | Value       |
|--------------------------|-------------|
| Base Curve               | TSI62       |
| Fe Basis                 | 62.0%       |
| Fe Adjustment            | $1.50/1%    |
| Moisture Basis           | 8.0%        |
| Moisture Penalty         | $0.90/1%    |
| SiO2 Basis               | 4.5%        |
| SiO2 Penalty             | $0.50/1%    |
| Al2O3 Basis              | 2.5%        |
| Al2O3 Penalty            | $0.30/1%    |
| P Basis                  | 0.08%       |
| P Penalty                | $2.00/1%    |
| S Basis                  | 0.02%       |
| S Penalty                | $1.00/1%    |
| Fixed Premium            | +$0.50      |

---

## Contract C001 — BUY

| Field             | Value                        |
|-------------------|------------------------------|
| Direction         | BUY                          |
| Counterparty      | Rio Tinto                    |
| Quantity          | 100,000 DMT                  |
| Delivery Period   | 2024-03-01 to 2024-03-31     |
| Incoterms         | CFR                          |
| Load Port         | Port Hedland                 |
| Discharge Port    | Qingdao                      |
| Quality Specs     | Fe 62%, Moisture 8%          |
| QP Convention     | MONTH_OF_BL                  |
| Pricing Formula   | Standard TSI62               |
| Status            | EXECUTED                     |

### Shipment S001 (under C001)

| Field             | Value                        |
|-------------------|------------------------------|
| Vessel            | MV Iron Pioneer              |
| BL Date           | 2024-03-15                   |
| BL Quantity       | 55,000 DMT                   |
| Status            | COMPLETED                    |

**Provisional Assay (S001):**

| Element   | Value  |
|-----------|--------|
| Fe %      | 63.2   |
| Moisture  | 8.5    |
| SiO2      | 4.2    |
| Al2O3     | 2.3    |
| P         | 0.07   |
| S         | 0.015  |

**Final Assay (S001):**

| Element   | Value  |
|-----------|--------|
| Fe %      | 62.8   |
| Moisture  | 8.8    |
| SiO2      | 4.6    |
| Al2O3     | 2.7    |
| P         | 0.09   |
| S         | 0.025  |

---

## Contract C002 — SELL

| Field             | Value                        |
|-------------------|------------------------------|
| Direction         | SELL                         |
| Counterparty      | Baosteel                     |
| Quantity          | 80,000 DMT                   |
| Delivery Period   | 2024-03-01 to 2024-03-31     |
| Incoterms         | CFR                          |
| Load Port         | Port Hedland                 |
| Discharge Port    | Shanghai                     |
| Quality Specs     | Fe 62%, Moisture 8%          |
| QP Convention     | MONTH_OF_BL                  |
| Pricing Formula   | Standard TSI62               |
| Status            | EXECUTED                     |

### Shipment S002 (under C002)

| Field             | Value                        |
|-------------------|------------------------------|
| Vessel            | MV Steel Voyager             |
| BL Date           | 2024-03-20                   |
| BL Quantity       | 80,000 DMT                   |
| Status            | COMPLETED                    |

**Provisional Assay (S002):**

| Element   | Value  |
|-----------|--------|
| Fe %      | 61.5   |
| Moisture  | 9.0    |
| SiO2      | 5.0    |
| Al2O3     | 2.8    |
| P         | 0.10   |
| S         | 0.03   |

---

## Contract C003 — BUY

| Field             | Value                        |
|-------------------|------------------------------|
| Direction         | BUY                          |
| Counterparty      | BHP                          |
| Quantity          | 60,000 DMT                   |
| Delivery Period   | 2024-04-01 to 2024-04-30     |
| Incoterms         | FOB                          |
| Load Port         | Port Hedland                 |
| Discharge Port    | Qingdao                      |
| Quality Specs     | Fe 62%, Moisture 8%          |
| QP Convention     | MONTH_PRIOR_BL               |
| Pricing Formula   | Standard TSI62               |
| Status            | CONFIRMED                    |

*(No shipment yet — open exposure for April)*

---

## Expected Calculation Results

### Provisional Price — Shipment S001

```
QP: March 2024 (full month) → Average: ~$120.54
Fe Adj:       (63.2 - 62.0) × $1.50 = +$1.80
Moisture:     (8.5 - 8.0) × $0.90   = -$0.45
SiO2:         4.2 < 4.5 basis        =  $0.00 (no penalty)
Al2O3:        2.3 < 2.5 basis        =  $0.00 (no penalty)
P:            0.07 < 0.08 basis       =  $0.00 (no penalty)
S:            0.015 < 0.02 basis      =  $0.00 (no penalty)
Fixed:                                = +$0.50
─────────────────────────────────────────────
Provisional Price = $122.39/DMT
Provisional Value = $122.39 × 55,000 = $6,731,450
```

### Final Price — Shipment S001

```
QP: March 2024 (full month) → Average: ~$120.54
Fe Adj:       (62.8 - 62.0) × $1.50 = +$1.20
Moisture:     (8.8 - 8.0) × $0.90   = -$0.72
SiO2:         (4.6 - 4.5) × $0.50   = -$0.05
Al2O3:        (2.7 - 2.5) × $0.30   = -$0.06
P:            (0.09 - 0.08) × $2.00  = -$0.02
S:            (0.025 - 0.02) × $1.00 = -$0.005
Fixed:                                = +$0.50
─────────────────────────────────────────────
Final Price = $121.39/DMT (approx)
Final Value = $121.39 × 55,000 = $6,676,450
```

### P&F Settlement — Shipment S001

```
Difference  = $121.39 - $122.39 = -$1.00/DMT
Settlement  = -$1.00 × 55,000  = -$55,000
Direction   = RECEIVABLE (buyer gets credit — final price lower than provisional)
```

### MTM — Contract C001 (as of 2024-03-28)

```
Current curve price (2024-03-28): $121.75
Contract price (latest = final on S001): $121.39
Open quantity: 100,000 - 55,000 = 45,000 DMT

MTM = ($121.75 - $121.39) × 45,000 × (+1) = +$16,200
```

### Exposure — Portfolio (as of 2024-03-28)

```
C001 (BUY):  open = 45,000 DMT  → Long
C002 (SELL): open = 0 DMT       → Fully shipped
C003 (BUY):  open = 60,000 DMT  → Long

March:  Net Long  45,000 DMT  × $121.75 = $5,478,750
April:  Net Long  60,000 DMT  × $121.75 = $7,305,000
```
