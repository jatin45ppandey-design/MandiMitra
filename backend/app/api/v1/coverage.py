"""Read-only verified data-coverage and freshness metrics."""
from datetime import UTC, date, datetime

from fastapi import APIRouter, Query
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
    age_days: int | None = None
    reporting_days: int = 0
    market_count: int = 0
    partial: bool = True


@router.get("/data/coverage", response_model=DataCoverage)
def coverage(
    state: str | None = Query(default=None, max_length=120),
    district: str | None = Query(default=None, max_length=120),
    commodity: str | None = Query(default=None, max_length=120),
) -> DataCoverage:
    snapshot = read_prices()
    rows = [
        row for row in snapshot.records
        if (not state or row.state.casefold() == state.casefold())
        and (not district or row.district.casefold() == district.casefold())
        and (not commodity or row.commodity.casefold() == commodity.casefold())
    ]
    date_latest = max((r.arrival_date for r in rows), default=None)
    age = (datetime.now(UTC).date() - date_latest).days if date_latest else None
    markets = {(r.state.casefold(), r.district.casefold(), r.market.casefold()) for r in rows}
    return DataCoverage(
        verified=snapshot.metadata.verified and bool(rows),
        record_count=len(rows),
        latest_report_date=date_latest,
        source=snapshot.metadata.source,
        verified_market_coordinates=len(read_verified_coordinates()),
        age_days=age,
        reporting_days=len({r.arrival_date for r in rows}),
        market_count=len(markets),
        partial=snapshot.metadata.partial,
        note=(
            "Real reported prices; data is not a guaranteed buyer quote. "
            + ("Latest matching report is more than three days old." if age is not None and age > 3 else "")
            if rows else "No matching verified government observations have been imported."
        ),
    )
