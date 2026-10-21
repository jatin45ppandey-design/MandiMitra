from fastapi import APIRouter, HTTPException, Query

from app.repositories.prices import read_prices
from app.schemas.prices import PriceResponse
from app.services.market_comparison import compare_same_district
from app.services.nearby import find_nearby, read_verified_coordinates
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
    """Same-district comparisons only; no inferred road distance."""
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
def nearby_markets(
    commodity: str = Query(min_length=1),
    variety: str = Query(min_length=1),
    grade: str = Query(min_length=1),
    latitude: float = Query(ge=-90, le=90),
    longitude: float = Query(ge=-180, le=180),
    radius_km: float = Query(default=100, gt=0, le=500),
) -> dict:
    """Nearby by geodesic distance, never a road-route or transport estimate."""
    coordinates = read_verified_coordinates()
    if not coordinates:
        return {
            "status": "coordinates_unavailable", "distance_type": "straight_line",
            "markets": [],
            "message": "Verified mandi coordinate registry is not configured",
        }
    snapshot = read_prices()
    records = filter_prices(snapshot, commodity=commodity, variety=variety)
    found = find_nearby(
        records, coordinates, latitude=latitude, longitude=longitude,
        radius_km=radius_km, variety=variety, grade=grade,
    )
    return {
        "status": "ok" if found else "no_matching_verified_markets",
        "distance_type": "straight_line",
        "markets": [
            {
                "distance_km": item.distance_km,
                "observation": item.record.model_dump(mode="json"),
            }
            for item in found
        ],
    }
