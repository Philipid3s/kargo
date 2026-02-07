# Kargo CTRM

Physical Iron Ore Commodity Trading Risk Management POC.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs for Swagger UI.

## Seed Sample Data

```bash
# Via CLI
cd backend && python -m app.seed.seed_data

# Via API
curl -X POST http://localhost:8000/seed
```

## Run Tests

```bash
cd backend && pytest -v
```

## API Endpoints

All under `/api/v1`:

| Resource | Endpoints |
|----------|-----------|
| `/contracts` | CRUD, status update, open quantity |
| `/shipments` | CRUD, compute-provisional, compute-final |
| `/price-curves` | CRUD, bulk data upload, average |
| `/pricing-formulas` | CRUD, evaluate (dry-run) |
| `/assays` | CRUD |
| `/mtm` | Run portfolio/contract, history |
| `/exposure` | By month, by direction |
| `/matching` | FIFO run, manual match, unwind |
| `/pnl` | Summary, realized, unrealized |
| `/dashboard` | Combined portfolio view |
