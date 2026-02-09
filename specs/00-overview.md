# 00 — Project Overview

## Purpose

KARGO is a lightweight CTRM proof of concept for **physical Iron Ore trading**.
It covers the full trade lifecycle: contract capture → shipment → pricing → settlement → risk management.

## Scope

### In Scope
- Contract management (Buy/Sell physical Iron Ore)
- Shipment tracking (vessel, BL date, BL quantity)
- Price curve management (TSI 62% Fe CFR China + others)
- Pricing formula engine (QP averaging, assay adjustments)
- Assay management (provisional + final)
- Provisional & Final pricing (P&F settlement)
- Mark-to-Market (MTM) valuation
- Price risk / exposure reporting
- Purchase/Sale matching with P&L

### Out of Scope (POC)
- Multi-commodity support
- Logistics scheduling beyond basic shipment tracking
- Invoicing & payment management
- Regulatory reporting
- Multi-currency (USD only)
- Multi-UoM (DMT only)
- Authentication / multi-user

## Tech Constraints

| Constraint         | Value                                    |
|--------------------|------------------------------------------|
| Database           | SQLite (file-based, local)               |
| Data model         | Relational, SQL-friendly                 |
| Migration target   | PostgreSQL (schema should be compatible) |
| Approach           | Backend-first domain modeling            |
| UI                 | Secondary concern for POC                |

## Design Principles

- Functional correctness over performance
- Clear domain modeling over enterprise patterns
- Extensibility over feature completeness
- Correct commodity trading terminology throughout
- Every design decision documented with brief rationale
