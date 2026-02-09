You are a senior CTRM / ETRM software architect with strong knowledge of
physical commodity trading, price risk management, and market valuation.

You are designing a WEB-BASED CTRM PROOF OF CONCEPT named **KARGO**.

KARGO is a lightweight CTRM focused on physical commodity trading.
For this POC, KARGO is limited to IRON ORE trading only.

This is a POC, not a production system.
The goal is functional correctness, clear domain modeling, and extensibility —
not performance, security hardening, or enterprise-scale complexity.

----------------------------------
TECH CONSTRAINTS
----------------------------------
- Database: SQLite (file-based, local)
- Relational data model
- SQL-friendly schema
- Designed to be easily migratable to PostgreSQL later
- Backend-first domain modeling
- UI considerations are secondary

----------------------------------
SCOPE LIMITATIONS (IMPORTANT)
----------------------------------
For this POC:
- Only IRON ORE contracts (no multi-commodity)
- No logistics scheduling
- No invoicing
- No regulatory reporting
- Single currency (USD)
- Single user (no auth complexity)

----------------------------------
FUNCTIONAL REQUIREMENTS
----------------------------------

1) CONTRACT MANAGEMENT (IRON ORE)
- Capture physical contracts:
  - Buy / Sell
  - Quantity (MT)
  - Delivery period
  - Incoterms (simple enum)
  - Counterparty
  - Quality specs (Fe %, moisture, impurities)
  - Pricing structure reference

2) PRICE CURVES
- Support Iron Ore reference curves (e.g. index-based)
- Curve stored as time series
- Ability to retrieve price by date
- Multiple curves allowed (for comparison / evolution)

3) PRICING FORMULAS
- Pricing formulas referencing:
  - Base price curve
  - Quality adjustments (premiums / penalties)
  - Moisture adjustment
- Formula must be stored as structured data (not hardcoded)
- Formula evaluated to compute contract price

4) ASSAY MANAGEMENT
- Store assay results per shipment / contract
- Apply assay values to pricing formulas
- Support provisional vs final assay

5) MARK-TO-MARKET (MTM)
- Daily MTM calculation per contract
- MTM based on:
  - Remaining open quantity
  - Current curve price
  - Pricing formula
- Store MTM history (by date)

6) PRICE RISK MANAGEMENT
- Exposure calculation:
  - Long / Short quantity
  - By delivery period
- Aggregated exposure view
- Curve-based valuation

7) PURCHASE / SALE MATCHING
- Ability to match buy and sell contracts
- Track matched vs open quantities
- Compute realized vs unrealized PnL
- Matching logic can be FIFO or manual (keep it simple)

----------------------------------
DELIVERABLES
----------------------------------
Please produce:

1) A clear DOMAIN MODEL
   - Main entities
   - Relationships
   - Responsibilities

2) A SQLITE DATABASE SCHEMA
   - Tables
   - Key fields
   - Relationships
   - Minimal but realistic

3) CORE CALCULATION LOGIC (PSEUDOCODE)
   - Pricing formula evaluation
   - MTM calculation
   - Exposure calculation
   - Matching logic

4) OPTIONAL (IF RELEVANT)
   - Suggestions for future extensions
   - Notes on migration to PostgreSQL

----------------------------------
STYLE & EXPECTATIONS
----------------------------------
- Be explicit and structured
- Use financial / trading terminology correctly
- Favor clarity over abstraction
- Avoid unnecessary enterprise patterns
- Think like a CTRM designer, not a generic CRUD app builder
