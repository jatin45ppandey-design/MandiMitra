from fastapi import APIRouter, Query

from app.repositories.prices import read_prices
from app.schemas.prices import TrendObservation, TrendResponse
from app.services.price_service import filter_prices

router = APIRouter(tags=["trends"])


@router.get("/trends", response_model=TrendResponse)
def trends(
    commodity: str = Query(min_length=1),
    state: str = Query(min_length=1),
    district: str = Query(min_length=1),
    market: str = Query(min_length=1),
    variety: str | None = None,
) -> TrendResponse:
    snapshot = read_prices()
    records = filter_prices(
        snapshot, commodity=commodity, state=state,
        district=district, market=market, variety=variety,
    )
    kinds = {(r.variety or "").casefold() for r in records}
    grades = {(r.grade or "").casefold() for r in records}
    if len(kinds) > 1 or len(grades) > 1:
        return TrendResponse(
            observations=[], verified=snapshot.metadata.verified,
            message="Multiple varieties or grades found; select a comparable series",
        )
    # Keep actual reported dates only; no interpolation.
    observations = [
        TrendObservation(
            report_date=r.arrival_date, modal_price=r.modal_price,
            market=r.market, variety=r.variety,
        )
        for r in reversed(records) if r.modal_price is not None
    ]
    return TrendResponse(
        observations=observations,
        verified=snapshot.metadata.verified,
        message=None if observations else "No verified historical observations reported",
    )
