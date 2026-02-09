# KARGO — CTRM Proof of Concept Prompt (v2)

You are a senior CTRM / ETRM software architect with strong knowledge of
physical commodity trading, price risk management, and market valuation.

You are designing a WEB-BASED CTRM PROOF OF CONCEPT named **KARGO**.

KARGO is a lightweight CTRM focused on physical commodity trading.
For this POC, KARGO is limited to **IRON ORE** trading only.

This is a POC, not a production system.
The goal is functional correctness, clear domain modeling, and extensibility —
not performance, security hardening, or enterprise-scale complexity.

---

## TECH CONSTRAINTS

- Database: **SQLite** (file-based, local)
- Relational data model
- SQL-friendly schema
- Designed to be easily migratable to PostgreSQL later
- Backend-first domain modeling
- UI considerations are secondary

---

## SCOPE LIMITATIONS (IMPORTANT)

For this POC:
- Only IRON ORE contracts (no multi-commodity)
- No logistics scheduling beyond basic shipment tracking
- No invoicing
- No regulatory reporting
- Single currency (USD)
- Single unit of measure (DMT — Dry Metric Ton)
- Single user (no auth complexity)

---

## REFERENCE CONTEXT — IRON ORE TRADING

To ensure domain accuracy, here is key context about physical Iron Ore trading:

### Benchmark Index
- The primary benchmark is **Platts TSI Iron Ore 62% Fe CFR China** (also known as TSI 62)
- Other common references: TSI 58% Fe, MB 62% Fe (Metal Bulletin)
- For this POC, support **at least TSI 62% Fe** as default curve

### Typical Deal Flow
1. Contract is agreed (Buy or Sell) with quantity, delivery period, pricing terms
2. Vessel is nominated → **Shipment** created (BL date, BL quantity)
3. **Provisional assay** is performed at load port → provisional pricing
4. **Final assay** is performed at discharge port → final pricing
5. Price is settled based on **Quotational Period (QP)** average and assay adjustments

### Pricing Example
A typical Iron Ore pricing formula:

```
Final Price (USD/DMT) =
    Average(TSI 62% Fe CFR China, over Quotational Period)
  + Fe Adjustment:    +/- $X per 1% Fe above/below 62%
  - Moisture Penalty:  -$Y per 1% moisture above 8%
  - Impurity Penalties: (SiO2, Al2O3, P, S — per spec)
```

### Quotational Period (QP)
- The QP defines which dates on the price curve are averaged to determine the contract price
- Common QP conventions:
  - **Month of BL** (Bill of Lading)
  - **Month prior to BL**
  - **Month after BL**
  - **Custom range** (e.g. BL date -15 / +15 days)
- The QP is a critical pricing parameter and must be stored per contract

---

## FUNCTIONAL REQUIREMENTS

### 1) CONTRACT MANAGEMENT

Capture physical Iron Ore contracts:

| Field               | Description                                      |
|---------------------|--------------------------------------------------|
| Direction           | Buy / Sell                                       |
| Counterparty        | Name of trading counterparty                     |
| Quantity            | Contracted quantity in DMT                       |
| Delivery Period     | Expected delivery window (start / end date)      |
| Incoterms           | Enum: CFR, CIF, FOB                             |
| Load Port           | Port of loading                                  |
| Discharge Port      | Port of discharge                                |
| Quality Specs       | Fe %, moisture %, SiO2, Al2O3, P, S (basis)     |
| Pricing Formula Ref | Link to pricing formula                          |
| QP Convention       | Quotational period rule (see above)              |
| Status              | Draft / Confirmed / Executed / Closed            |

### 2) SHIPMENTS

Shipments represent the physical execution of a contract:

| Field             | Description                                     |
|-------------------|-------------------------------------------------|
| Contract Ref      | Parent contract                                 |
| Vessel Name       | Name of vessel                                  |
| BL Date           | Bill of Lading date                             |
| BL Quantity       | Quantity as per BL (DMT)                        |
| Load Port         | Actual load port                                |
| Discharge Port    | Actual discharge port                           |
| Status            | Nominated / Loaded / Discharged / Completed     |

A contract can have **one or multiple shipments** (partial shipments).

### 3) PRICE CURVES

- Support Iron Ore reference price curves (time series)
- Primary curve: **TSI 62% Fe CFR China**
- Curve stored as: `(curve_id, date, price_usd_per_dmt)`
- Ability to retrieve:
  - Price by date
  - Average price over a date range (for QP calculation)
- Multiple curves allowed (e.g. TSI 62, TSI 58, MB 62 for comparison)
- Support for **curve snapshots** (same curve, different observation dates — for MTM history)

### 4) PRICING FORMULAS

Pricing formulas are **structured data** (not hardcoded logic):

| Component              | Description                                           |
|------------------------|-------------------------------------------------------|
| Base Curve Reference   | Which price curve to use (e.g. TSI 62)                |
| QP Rule                | How to determine the averaging period                 |
| Fe Adjustment          | Premium/penalty per 1% Fe vs basis (e.g. 62%)        |
| Moisture Adjustment    | Penalty per 1% moisture above threshold (e.g. 8%)    |
| Impurity Adjustments   | Penalties for SiO2, Al2O3, P, S above spec           |
| Fixed Premium/Discount | Optional flat adjustment (USD/DMT)                    |

The formula engine must:
- Accept assay values as input
- Retrieve the appropriate curve prices for the QP
- Compute the **provisional price** (using provisional assay)
- Compute the **final price** (using final assay)
- Return a breakdown of each component

### 5) ASSAY MANAGEMENT

| Field              | Description                                      |
|--------------------|--------------------------------------------------|
| Shipment Ref       | Parent shipment                                  |
| Assay Type         | Provisional / Final                              |
| Fe %               | Iron content                                     |
| Moisture %         | Moisture content                                 |
| SiO2 %             | Silica                                           |
| Al2O3 %            | Alumina                                          |
| P %                | Phosphorus                                       |
| S %                | Sulphur                                          |
| Assay Date         | Date of analysis                                 |
| Source              | Load port surveyor / Discharge port surveyor     |

Business rules:
- A shipment may have **0, 1, or 2 assays** (provisional + final)
- Provisional assay triggers **provisional pricing**
- Final assay triggers **final pricing** and **P&F settlement** (price adjustment)

### 6) PROVISIONAL & FINAL PRICING (P&F SETTLEMENT)

This is the standard Iron Ore settlement workflow:

1. **Provisional Price**: computed using provisional assay + QP curve prices
2. **Final Price**: computed using final assay + QP curve prices (QP may be same or adjusted)
3. **P&F Adjustment** = (Final Price - Provisional Price) × BL Quantity
   - Positive → additional payment due
   - Negative → credit / refund due

Store both provisional and final price per shipment with full breakdown.

### 7) MARK-TO-MARKET (MTM)

Daily MTM calculation per contract:

```
MTM = (Current Curve Price - Contract Price) × Open Quantity × Direction Factor
```

Where:
- **Direction Factor**: +1 for Buy (long), -1 for Sell (short)
- **Current Curve Price**: latest available price on the reference curve
- **Contract Price**: latest computed price (provisional or final, depending on status)
- **Open Quantity**: contracted quantity minus shipped/settled quantity

Requirements:
- MTM calculated at **contract level** and **aggregated across portfolio**
- Store MTM history: `(contract_id, valuation_date, mtm_value, curve_price_used)`
- Support re-running MTM for a given date with different curve snapshots (scenario analysis)

### 8) PRICE RISK / EXPOSURE

Exposure calculation:

| Dimension        | Description                                    |
|------------------|------------------------------------------------|
| Direction        | Long (Buy) / Short (Sell)                      |
| Open Quantity    | Quantity not yet priced or settled              |
| Delivery Period  | Month/period of exposure                       |
| Curve Reference  | Which curve the exposure is against             |

Aggregation views:
- **Net exposure by delivery month** (long - short)
- **Gross exposure** (total open quantity)
- **Exposure in USD** = open quantity × current curve price

### 9) PURCHASE / SALE MATCHING

- Match Buy contracts against Sell contracts
- Track **matched quantity** vs **open quantity** per contract
- Matching methods: **FIFO** (default) or **Manual**
- Compute:
  - **Realized P&L** = (Sell Price - Buy Price) × Matched Quantity
  - **Unrealized P&L** = MTM on remaining open quantity
- Matching creates a `match` record linking buy_contract, sell_contract, matched_qty

---

## DELIVERABLES

### 1) DOMAIN MODEL
- Main entities and their relationships
- Clear responsibility boundaries
- Expressed as a **Mermaid ERD** + textual description

### 2) SQLite DATABASE SCHEMA
- Full DDL (CREATE TABLE statements)
- Primary keys, foreign keys, constraints
- Realistic column types and defaults
- ENUMs expressed as CHECK constraints (SQLite-compatible)
- Comments explaining non-obvious design choices

### 3) CORE CALCULATION LOGIC (PSEUDOCODE or PYTHON-LIKE)
- **QP average price** calculation
- **Pricing formula evaluation** (with assay inputs)
- **Provisional & Final price** computation
- **P&F settlement** calculation
- **MTM** calculation (single contract + portfolio)
- **Exposure** aggregation
- **Matching** logic (FIFO)
- **Realized vs Unrealized P&L**

### 4) SAMPLE DATA
- 2-3 example contracts (buy + sell)
- A sample price curve (TSI 62, ~30 days of prices)
- Sample assay values
- Expected calculation results (for validation)

### 5) EXTENSION NOTES
- Migration path to PostgreSQL (key changes needed)
- Suggestions for future extensions:
  - Multi-commodity
  - FX handling
  - Derivative hedging overlay
  - Logistics module
  - Reporting / BI layer

---

## STYLE & EXPECTATIONS

- Be explicit and structured
- Use correct financial / commodity trading terminology
- Favor clarity over abstraction
- Avoid unnecessary enterprise patterns (no DDD overkill, no microservices)
- Think like a **CTRM domain expert**, not a generic CRUD app builder
- If you make a design decision, explain the reasoning briefly
- The schema and logic should be **immediately usable** — not just conceptual
