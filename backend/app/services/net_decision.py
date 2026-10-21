"""Freshness-aware road-deal estimates; no guaranteed sale claims."""
from datetime import date, datetime
from zoneinfo import ZoneInfo
from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.road_comparison import RoadMarketResult


class NetMarket(RoadMarketResult):
    age_days: int
    eligible: bool
    exclusion_reason: str | None = None


class NetDecisionResponse(BaseModel):
    status: Literal[
        "ok", "input_required", "insufficient_fresh_data",
        "coordinates_unavailable", "no_matching_verified_markets",
    ]
    markets: list[NetMarket] = Field(default_factory=list)
    best_market: str | None = None
    excluded_without_coordinates: int = 0
    distance_type: Literal["road_route"] = "road_route"
    source: Literal["OpenRouteService"] = "OpenRouteService"
    latest_report_date: date | None = None
    message: str
    disclaimer: str = (
        "Estimates only. Price reports are NOT buyer offers. "
        "Real freight, road/toll conditions and sale price can differ."
    )


def build_decision(
    candidates: list[RoadMarketResult],
    *,
    excluded_without_coordinates: int = 0,
    today: date | None = None,
) -> NetDecisionResponse:
    today = today or datetime.now(ZoneInfo("Asia/Kolkata")).date()
    newest = max((item.observation.arrival_date for item in candidates), default=None)
    annotated = []
    for item in candidates:
        age = max(0, (today - item.observation.arrival_date).days)
        reasons = []
        if age > 3:
            reasons.append("Reported rate older than 3 days")
        if item.route_status != "available" or item.distance_km is None:
            reasons.append("Road distance unavailable")
        if item.estimate is None:
            reasons.append("Quantity and transport cost are required")
        annotated.append(NetMarket(
            **item.model_dump(), age_days=age,
            eligible=not reasons,
            exclusion_reason="; ".join(reasons) if reasons else None,
        ))
    eligible = [item for item in annotated if item.eligible]
    eligible.sort(key=lambda item: item.estimate.net_proceeds, reverse=True)
    excluded = [item for item in annotated if not item.eligible]
    excluded.sort(key=lambda item: (item.age_days, item.observation.market.casefold()))
    if eligible:
        status = "ok"
        message = "Ranked by estimated net proceeds for genuinely recent comparable reports."
    elif any(x.estimate is None for x in annotated):
        status = "input_required"
        message = "Enter crop quantity and cost/km to compare estimated net proceeds."
    else:
        status = "insufficient_fresh_data"
        message = "No recent, comparable, route-available observations; no best market claimed."
    return NetDecisionResponse(
        status=status, markets=[*eligible, *excluded],
        best_market=eligible[0].observation.market if eligible else None,
        excluded_without_coordinates=excluded_without_coordinates,
        latest_report_date=newest, message=message,
    )
