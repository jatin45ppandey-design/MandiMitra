"""Join genuine market prices, sourced market positions and road estimates."""
from decimal import Decimal, ROUND_HALF_UP

from app.schemas.prices import MarketPrice
from app.schemas.road_comparison import RoadCompareRequest, RoadEstimate, RoadMarketResult
from app.services.nearby import find_nearby, read_verified_coordinates
from app.services.openrouteservice import OpenRouteServiceClient

RUPEE = Decimal("0.01")


def make_estimate(
    price: MarketPrice,
    distance_km: float | None,
    request: RoadCompareRequest,
) -> RoadEstimate | None:
    if (
        distance_km is None
        or request.quantity_quintals is None
        or request.cost_per_km is None
        or price.modal_price is None
    ):
        return None
    gross = price.modal_price * request.quantity_quintals
    cost = Decimal(str(distance_km)) * request.cost_per_km + request.fixed_cost
    return RoadEstimate(
        gross_proceeds=gross.quantize(RUPEE, rounding=ROUND_HALF_UP),
        transport_cost=cost.quantize(RUPEE, rounding=ROUND_HALF_UP),
        net_proceeds=(gross - cost).quantize(RUPEE, rounding=ROUND_HALF_UP),
    )


async def compare_roads(
    records: list[MarketPrice],
    request: RoadCompareRequest,
    *,
    client: OpenRouteServiceClient | None = None,
) -> tuple[list[RoadMarketResult], int, bool]:
    """Returns markets, excluded coordinate count, and registry presence."""
    coordinates = read_verified_coordinates()
    if not coordinates:
        return [], 0, False

    comparable = [
        record for record in records
        if record.state.casefold() == request.state.casefold()
        and record.commodity.casefold() == request.commodity.casefold()
        and (record.variety or "").casefold() == request.variety.casefold()
        and (record.grade or "").casefold() == request.grade.casefold()
    ]
    # Count distinct markets with missing verified registry entries.
    names = {
        (r.state.casefold(), r.district.casefold(), r.market.casefold())
        for r in comparable
    }
    missing = len(names - set(coordinates.keys()))
    candidates = find_nearby(
        comparable, coordinates,
        latitude=request.latitude, longitude=request.longitude,
        radius_km=request.radius_km,
        variety=request.variety, grade=request.grade,
    )[:8]
    if not candidates:
        return [], missing, True

    router = client or OpenRouteServiceClient()
    routes = await router.road_matrix(
        origin=(request.latitude, request.longitude),
        destinations=[
            coordinates[
                (
                    entry.record.state.casefold(),
                    entry.record.district.casefold(),
                    entry.record.market.casefold(),
                )
            ]
            for entry in candidates
        ],
    )
    if len(routes) != len(candidates):
        raise ValueError("Routing matrix result count mismatch")

    items: list[RoadMarketResult] = []
    for entry, route in zip(candidates, routes, strict=True):
        items.append(RoadMarketResult(
            observation=entry.record,
            distance_km=route.distance_km,
            duration_minutes=route.duration_minutes,
            route_status="available" if route.distance_km is not None else "unreachable",
            estimate=make_estimate(entry.record, route.distance_km, request),
        ))
    # Present reachable markets first, then approximate driving distance ascending.
    return sorted(
        items,
        key=lambda item: (
            item.distance_km is None,
            item.distance_km if item.distance_km is not None else float("inf"),
        ),
    ), missing, True
