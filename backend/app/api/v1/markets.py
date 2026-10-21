from fastapi import APIRouter, HTTPException, Query

from app.repositories.prices import read_prices
from app.schemas.prices import PriceResponse
from app.services.market_comparison import compare_same_district
from app.services.price_service import build_price_response, filter_prices

router = APIRouter(prefix="/markets", tags=["markets"])


@router.get("/compare", response_model=PriceResponse)
def compare_markets(
    commodity: str = Query(min_length=1),
    state: str = Query(min_length=1),
    district: str = Query(min_length=1),
    variety: str | None = None,
    grade: str | None = None,
) -> PriceResponse:
    """Same-district comparison only, NOT a ranked nearby-distance claim."""
    if not variety or not grade:
        raise HTTPException(
            status_code=422,
            detail="Select both variety and grade for a directly comparable mandi listing",
        )
    snapshot = read_prices()
    records = filter_prices(
        snapshot, commodity=commodity, state=state, district=district,
        variety=variety,
    )
    return build_price_response(
        snapshot, compare_same_district(records, variety=variety, grade=grade)
    )


@router.get("/nearby")
def nearby_markets() -> None:
    raise HTTPException(
        status_code=422,
        detail="Verified mandi coordinates and routing data are not configured; distance ranking unavailable",
    )
