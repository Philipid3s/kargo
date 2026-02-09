# Kargo CTRM

Physical Iron Ore Commodity Trading Risk Management POC.

## Tech Stack

| Layer | Stack |
|-------|-------|
| **Backend** | Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, SQLite |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, TanStack Query, React Router |
| **Tests** | pytest + in-memory SQLite |

## Run with Docker

```bash
docker compose up -d
```

This pulls and starts both containers:
- **Frontend** — http://localhost
- **Backend API** — http://localhost:8000 (Swagger UI at `/docs`)

The `compose.yaml` expects images from Docker Hub (`philipid3s/kargo-backend`, `philipid3s/kargo-frontend`). A `backend/data/` directory is created locally to persist the SQLite database.

```bash
docker compose ps       # Check status
docker compose logs -f  # Follow logs
docker compose down     # Stop and remove containers
```

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API runs on http://localhost:8000. Swagger UI at http://localhost:8000/docs.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on http://localhost:5173 (proxies `/api` requests to backend).

## Seed Sample Data

Use the **Seed Database** button on the dashboard, or:

```bash
# Via CLI
cd backend && python -m app.seed.seed_data

# Via API
curl -X POST http://localhost:8000/seed
```

Seeds 3 contracts, TSI 62 price curve, 5 assays, and related shipments.

## Run Tests

```bash
cd backend && pytest -v
```

## Project Structure

```
kargo/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy ORM (9 tables)
│   │   ├── schemas/         # Pydantic request/response models
│   │   ├── services/        # Business logic
│   │   ├── routes/          # FastAPI routers under /api/v1
│   │   ├── seed/            # Sample data seeder
│   │   └── main.py          # App entry point
│   └── tests/               # pytest with in-memory SQLite
├── frontend/
│   └── src/
│       ├── api/             # Fetch wrapper + API modules
│       ├── components/
│       │   ├── layout/      # AppLayout, Sidebar, PageHeader
│       │   ├── shared/      # DataTable, StatusBadge, KpiCard, ConfirmDialog
│       │   └── ui/          # shadcn/ui primitives
│       ├── hooks/           # TanStack Query hooks per entity
│       ├── lib/             # Utils + formatters
│       ├── pages/           # 9 page components
│       └── types/           # TypeScript interfaces mirroring backend schemas
└── README.md
```

## Frontend Pages

| Page | Features |
|------|----------|
| **Dashboard** | KPI cards, P&L summary, exposure-by-month table, Seed/MTM/FIFO actions |
| **Contracts** | Full CRUD, direction & status filters |
| **Shipments** | Full CRUD, compute provisional & final pricing |
| **Price Curves** | CRUD, expandable data panel, bulk CSV upload |
| **Pricing Formulas** | CRUD with nested adjustments, formula evaluator |
| **Assays** | Full CRUD for provisional & final assays |
| **Mark-to-Market** | Run MTM with date picker, results & history tables |
| **Matching** | Run FIFO, manual match, unwind all |
| **P&L** | Summary KPIs, tabbed view (by-contract, realized, unrealized) |

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
