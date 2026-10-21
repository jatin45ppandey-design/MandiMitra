"""Read-only API that makes missing government data unmistakable."""
from datetime import date

from fastapi import APIRouter
from pydantic import BaseModel

from app.repositories.prices import read_prices
from app.services.nearby import read_verified_coordinates

router = APIRouter(tags=["coverage"])


class DataCoverage(BaseModel):
    verified: bool
    record_count: int
    latest_report_date: date | None
    source: str
    verified_market_coordinates: int
    note: str


@router.get("/data/coverage", response_model=DataCoverage)
def coverage() -> DataCoverage:
    snapshot = read_prices()
    records = snapshot.records
    return DataCoverage(
        verified=snapshot.metadata.verified and bool(records),
        record_count=len(records),
        latest_report_date=max(
            (r.arrival_date for r in records), default=None
        ),
        source=snapshot.metadata.source,
        verified_market_coordinates=len(read_verified_coordinates()),
        note=(
            "Official reported wholesale prices; not guaranteed sale offers."
            if records else
            "No verified government observations imported yet."
        ),
    )
