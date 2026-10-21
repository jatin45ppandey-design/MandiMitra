from fastapi import APIRouter, Query

from app.repositories.snapshot import SnapshotRepository
from app.schemas.prices import ListingResponse, PriceResponse
from app.services.price_service import build_price_response, filter_prices

router = APIRouter(tags=["prices"])


@router.get("/commodities", response_model=ListingResponse)
def commodities() -> ListingResponse:
    records = SnapshotRepository().read().records
    return ListingResponse(items=sorted({r.commodity for r in records}))


@router.get("/states", response_model=ListingResponse)
def states() -> ListingResponse:
    records = SnapshotRepository().read().records
    return ListingResponse(items=sorted({r.state for r in records}))


@router.get("/districts", response_model=ListingResponse)
def districts(state: str | None = None) -> ListingResponse:
    records = SnapshotRepository().read().records
    if state:
        records = [r for r in records if r.state.casefold() == state.casefold()]
    return ListingResponse(items=sorted({r.district for r in records}))


@router.get("/prices", response_model=PriceResponse)
def prices(
    commodity: str | None = Query(default=None, min_length=1),
    state: str | None = Query(default=None, min_length=1),
    district: str | None = Query(default=None, min_length=1),
    market: str | None = Query(default=None, min_length=1),
    variety: str | None = Query(default=None, min_length=1),
) -> PriceResponse:
    snapshot = SnapshotRepository().read()
    records = filter_prices(
        snapshot, commodity=commodity, state=state, district=district,
        market=market, variety=variety
    )
    return build_price_response(snapshot, records)

