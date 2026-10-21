import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import alerts, earnings, health, markets, notifications, prices, trends
from app.core.config import settings

logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="MandiMitra API",
    description="Verified mandi prices with explicit reporting dates. No synthetic prices.",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

for router in (
    health.router, prices.router, markets.router, trends.router,
    earnings.router, alerts.router, notifications.router,
):
    app.include_router(router, prefix=settings.api_prefix)
