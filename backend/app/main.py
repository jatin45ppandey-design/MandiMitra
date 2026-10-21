import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import health, markets, prices, trends
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="MandiMitra API",
    description="Verified mandi prices with explicit reporting dates. No synthetic prices.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

for router in (health.router, prices.router, markets.router, trends.router):
    app.include_router(router, prefix=settings.api_prefix)

