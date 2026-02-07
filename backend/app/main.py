from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
import app.models  # noqa: F401 — ensure all models registered before create_all


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.routes import (
    price_curves, pricing_formulas, contracts, shipments, assays,
    mtm, exposure, matching, pnl, dashboard,
)

app.include_router(price_curves.router)
app.include_router(pricing_formulas.router)
app.include_router(contracts.router)
app.include_router(shipments.router)
app.include_router(assays.router)
app.include_router(mtm.router)
app.include_router(exposure.router)
app.include_router(matching.router)
app.include_router(pnl.router)
app.include_router(dashboard.router)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/seed", tags=["Admin"])
def seed_database():
    from app.seed.seed_data import seed
    seed()
    return {"status": "seeded"}
