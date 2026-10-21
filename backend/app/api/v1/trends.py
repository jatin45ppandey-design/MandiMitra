"""Same-market, same-variety, same-grade real reported observations only."""
from datetime import date

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
    grade: str | None = None,
    from_date: date | None = None,
    to_date: date | None = None,
) -> TrendResponse:
    snapshot = read_prices()
    records = filter_prices(
        snapshot, commodity=commodity, state=state,
        district=district, market=market, variety=variety,
    )
    if grade is not None:
        records = [r for r in records if (r.grade or "").casefold() == grade.casefold()]
    kinds = {(r.variety or "").casefold() for r in records}
    grades = {(r.grade or "").casefold() for r in records}
    if len(kinds) > 1 or len(grades) > 1:
        return TrendResponse(
            observations=[], verified=snapshot.metadata.verified,
            message="Multiple varieties or grades found; select a comparable series",
        )
    if from_date and to_date and from_date > to_date:
        return TrendResponse(observations=[], verified=snapshot.metadata.verified,
                             message="Invalid date range")
    if from_date:
        records = [r for r in records if r.arrival_date >= from_date]
    if to_date:
        records = [r for r in records if r.arrival_date <= to_date]
    # Multiple observations for one reporting day are NOT additional historical days.
    # Prefer the first (latest stored) record for that day deterministically.
    by_day = {}
    for r in records:
        if r.modal_price is not None and r.arrival_date not in by_day:
            by_day[r.arrival_date] = r
    observations = [
        TrendObservation(
            report_date=r.arrival_date, modal_price=r.modal_price,
            market=r.market, variety=r.variety,
        )
        for _, r in sorted(by_day.items())
    ]
    return TrendResponse(
        observations=observations, verified=snapshot.metadata.verified,
        message=None if observations else "No verified historical observations reported",
    )
