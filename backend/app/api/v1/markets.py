from fastapi import APIRouter, Query

from app.repositories.snapshot import SnapshotRepository
from app.schemas.prices import PriceResponse
from app.services.price_service import (
    build_price_response,
    filter_prices,
    latest_per_market_and_variety,
)

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/compare", response_model=PriceResponse)
def compare_markets(
    commodity: str = Query(min_length=1),
    state: str = Query(min_length=1),
    district: str = Query(min_length=1),
    variety: str | None = None,
) -> PriceResponse:
    """Latest observation per mandi/variety/grade; NOT distance-ranked.

    This is a same-district listing, not a guarantee of nearby road distances.
    Each record retains its own reporting date so stale prices remain visible.
    """
    snapshot = SnapshotRepository().read()
    records = filter_prices(
        snapshot, commodity=commodity, state=state, district=district, variety=variety
    )
    return build_price_response(snapshot, latest_per_market_and_variety(records))
