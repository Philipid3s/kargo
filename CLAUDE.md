# Kargo CTRM

## Project

KARGO is a lightweight, web-based CTRM (Commodity Trading & Risk Management) system focused on **physical Iron Ore trading**. This is a POC — the goal is functional correctness, clear domain modeling, and extensibility.

## Stack
- Backend: Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite
- Tests: pytest + httpx

## Commands
- Start: `cd backend && uvicorn app.main:app --reload`
- Test: `cd backend && pytest -v`
- Seed: `cd backend && python -m app.seed.seed_data` (or POST /seed)

## Structure
- `backend/app/models/` — SQLAlchemy ORM (9 tables)
- `backend/app/schemas/` — Pydantic request/response models
- `backend/app/services/` — Business logic (no HTTP awareness)
- `backend/app/routes/` — Thin FastAPI routers under /api/v1
- `backend/tests/` — pytest with in-memory SQLite
- `specs/` —  Business requirements & domain rules (READ THESE FIRST)
- `docs/` —  Architecture decisions, glossary, sample data

## Before Starting Any Work

1. **Always read the relevant spec file(s)** in `specs/` before implementing a feature
2. Refer to `docs/glossary.md` for Iron Ore trading terminology
3. Use `docs/sample-data.md` to validate calculation logic

## Key Domain Concepts
- **QP Convention**: Quotational Period determines which curve dates to average
- **Pricing Formula**: base curve price + Fe adjustment + moisture penalty + impurity penalties + fixed premium
- **P&F Settlement**: (Final Price - Provisional Price) × BL Quantity
- **MTM**: (Curve Price - Contract Price) × Open Quantity × Direction Factor
- **FIFO Matching**: Sort BUYs/SELLs by delivery_start, match sequentially

## Conventions
- Use correct financial / commodity trading terminology (see glossary)
- Favor clarity over abstraction — no DDD overkill, no microservices
- Every design decision should have a brief justification
- Schema and logic should be **immediately usable**, not just conceptual
- Dates stored as ISO-8601 TEXT in SQLite
- All prices in USD/DMT
- Direction: BUY (+1) or SELL (-1) for MTM
- Services raise HTTPException for business rule violations
