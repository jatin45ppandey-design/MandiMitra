from fastapi import APIRouter, Query

from app.repositories.snapshot import SnapshotRepository
from app.schemas.prices import PriceResponse
from app.services.price_service import build_price_response, filter_prices

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/compare", response_model=PriceResponse)
def compare_markets(
    commodity: str = Query(min_length=1),
    state: str = Query(min_length=1),
    district: str = Query(min_length=1),
    variety: str | None = None,
) -> PriceResponse:
    """Phase 0: within-district records only; no claim of distance ranking."""
    snapshot = SnapshotRepository().read()
    records = filter_prices(
        snapshot, commodity=commodity, state=state, district=district, variety=variety
    )
    return build_price_response(snapshot, records)

