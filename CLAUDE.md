# Kargo CTRM

## Project
Physical Iron Ore CTRM (Commodity Trading Risk Management) POC.

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

## Key Domain Concepts
- **QP Convention**: Quotational Period determines which curve dates to average
- **Pricing Formula**: base curve price + Fe adjustment + moisture penalty + impurity penalties + fixed premium
- **P&F Settlement**: (Final Price - Provisional Price) × BL Quantity
- **MTM**: (Curve Price - Contract Price) × Open Quantity × Direction Factor
- **FIFO Matching**: Sort BUYs/SELLs by delivery_start, match sequentially

## Conventions
- Dates stored as ISO-8601 TEXT in SQLite
- All prices in USD/DMT
- Direction: BUY (+1) or SELL (-1) for MTM
- Services raise HTTPException for business rule violations
