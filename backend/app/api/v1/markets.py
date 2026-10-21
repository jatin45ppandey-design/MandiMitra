from fastapi import APIRouter, HTTPException, Query

from app.repositories.prices import read_prices
from app.schemas.prices import PriceResponse
from app.schemas.road_comparison import RoadCompareRequest, RoadCompareResponse
from app.services.market_comparison import compare_same_district
from app.services.net_decision import NetDecisionResponse, build_decision
from app.services.nearby import find_nearby, read_verified_coordinates
from app.services.openrouteservice import RoutingNotConfigured, RoutingUnavailable
from app.services.price_service import build_price_response, filter_prices
from app.services.road_comparison import compare_roads

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

@router.post("/road-compare", response_model=RoadCompareResponse)
async def road_compare_markets(request: RoadCompareRequest) -> RoadCompareResponse:
    """ORS driving-car road distances for verified mandis; no guessed locations.

    Optional per-kilometre costs are entered by the farmer. Neither ORS nor
    the app knows actual freight quotes, tolls or buying offers.
    """
    snapshot = read_prices()
    try:
        markets, missing_count, registry_present = await compare_roads(
            snapshot.records, request
        )
    except RoutingNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except RoutingUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None

    if not registry_present:
        return RoadCompareResponse(
            status="coordinates_unavailable",
            message="Verified mandi coordinate registry is not configured",
        )
    if not markets:
        return RoadCompareResponse(
            status="no_matching_verified_markets",
            excluded_without_coordinates=missing_count,
            message="No matching mandis with verified coordinates in this radius",
        )
    return RoadCompareResponse(
        status="ok",
        markets=markets,
        excluded_without_coordinates=missing_count,
        latest_report_date=max(item.observation.arrival_date for item in markets),
        message=(
            "Road distance from OpenRouteService; reporting dates shown per mandi. "
            "Compare varieties, grade and freshness before choosing."
        ),
    )


@router.post("/net-compare", response_model=NetDecisionResponse)
async def net_compare_markets(request: RoadCompareRequest) -> NetDecisionResponse:
    """Price minus farmer-supplied road costs; only recent verified matches can rank."""
    snapshot = read_prices()
    try:
        results, missing, registry_present = await compare_roads(snapshot.records, request)
    except RoutingNotConfigured as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except RoutingUnavailable as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    if not registry_present:
        return NetDecisionResponse(status="coordinates_unavailable",
                                   message="Verified mandi coordinate registry unavailable")
    if not results:
        return NetDecisionResponse(status="no_matching_verified_markets",
                                   excluded_without_coordinates=missing,
                                   message="No comparable verified markets within radius")
    return build_decision(results, excluded_without_coordinates=missing)
