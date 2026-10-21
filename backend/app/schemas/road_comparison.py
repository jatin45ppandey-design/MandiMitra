"""Road estimates are independent of source reporting dates and sale certainty."""
from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator

from app.schemas.prices import MarketPrice


class RoadCompareRequest(BaseModel):
    state: str = Field(min_length=1, max_length=120)
    commodity: str = Field(min_length=1, max_length=120)
    variety: str = Field(min_length=1, max_length=120)
    grade: str = Field(min_length=1, max_length=120)
    latitude: float = Field(ge=-90, le=90, allow_inf_nan=False)
    longitude: float = Field(ge=-180, le=180, allow_inf_nan=False)
    radius_km: float = Field(default=150, gt=0, le=400, allow_inf_nan=False)
    quantity_quintals: Decimal | None = Field(default=None, gt=0)
    cost_per_km: Decimal | None = Field(default=None, ge=0)
    fixed_cost: Decimal = Field(default=Decimal(0), ge=0)

    @model_validator(mode="after")
    def validate_estimation_fields(self) -> "RoadCompareRequest":
        if (self.quantity_quintals is None) != (self.cost_per_km is None):
            raise ValueError(
                "Provide both quantity_quintals and cost_per_km for net estimates"
            )
        if self.fixed_cost > 0 and self.quantity_quintals is None:
            raise ValueError("Fixed costs require quantity and cost_per_km")
        return self


class RoadEstimate(BaseModel):
    gross_proceeds: Decimal
    transport_cost: Decimal
    net_proceeds: Decimal
    currency: Literal["INR"] = "INR"
    estimated: bool = True


class RoadMarketResult(BaseModel):
    observation: MarketPrice
    distance_km: float | None
    duration_minutes: float | None
    route_status: Literal["available", "unreachable"]
    estimate: RoadEstimate | None = None


class RoadCompareResponse(BaseModel):
    status: Literal[
        "ok", "coordinates_unavailable", "no_matching_verified_markets"
    ]
    distance_type: Literal["road_route"] = "road_route"
    source: Literal["OpenRouteService"] = "OpenRouteService"
    markets: list[RoadMarketResult] = Field(default_factory=list)
    latest_report_date: date | None = None
    excluded_without_coordinates: int = 0
    message: str
    disclaimer: str = (
        "Road distances and travel times are estimates. Modal mandi rates "
        "are reported wholesale observations, not guaranteed sale offers. "
        "Transport cost assumes one-way travel unless the farmer adjusts it."
    )
