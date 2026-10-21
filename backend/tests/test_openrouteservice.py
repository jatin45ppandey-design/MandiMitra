"""Mock-only routing tests: no real ORS account, no official mandi positions."""
import asyncio
from datetime import date
from decimal import Decimal

import httpx
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata
from app.schemas.road_comparison import RoadCompareRequest
from app.services.openrouteservice import (
    OpenRouteServiceClient,
    RoadMetric,
    RoutingNotConfigured,
    RoutingUnavailable,
)
from app.services.road_comparison import compare_roads


def _fixture(market: str, report_date: date) -> MarketPrice:
    return MarketPrice(
        state="Test State", district="Test District",
        market=market, commodity="Wheat", variety="Dara", grade="FAQ",
        modal_price=Decimal("2500"), arrival_date=report_date,
    )


def _request(**overrides: object) -> RoadCompareRequest:
    defaults = {
        "state": "Test State", "commodity": "Wheat",
        "variety": "Dara", "grade": "FAQ",
        "latitude": 20.0, "longitude": 80.0,
    }
    return RoadCompareRequest(**{**defaults, **overrides})


def test_ors_matrix_uses_lon_lat_key_in_header_and_km_units() -> None:
    async def handle(request: httpx.Request) -> httpx.Response:
        assert request.method == "POST"
        assert request.url.path == "/v2/matrix/driving-car"
        assert request.headers["Authorization"] == "fake-test-key"
        assert "fake-test-key" not in str(request.url)
        payload = __import__("json").loads(request.content)
        assert payload["locations"] == [[80.0, 20.0], [80.1, 20.2]]
        assert payload["sources"] == ["0"]
        assert payload["destinations"] == ["1"]
        assert payload["units"] == "km"
        return httpx.Response(
            200,
            json={"distances": [[12.5]], "durations": [[1500]]},
        )

    client = OpenRouteServiceClient(
        api_key="fake-test-key", transport=httpx.MockTransport(handle)
    )
    result = asyncio.run(client.road_matrix(
        origin=(20.0, 80.0), destinations=[(20.2, 80.1)]
    ))
    assert result == [RoadMetric(distance_km=12.5, duration_minutes=25.0)]


def test_ors_unreachable_route_not_invented() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={
            "distances": [[None]], "durations": [[None]]
        })

    result = asyncio.run(OpenRouteServiceClient(
        api_key="fake-test-key", transport=httpx.MockTransport(handle)
    ).road_matrix(origin=(20, 80), destinations=[(21, 81)]))
    assert result[0].distance_km is None
    assert result[0].duration_minutes is None


def test_routing_errors_never_include_key() -> None:
    secret = "never-print-this-test-key"
    def handle(request: httpx.Request) -> httpx.Response:
        return httpx.Response(429, json={"error": "quota reached"})
    client = OpenRouteServiceClient(
        api_key=secret, transport=httpx.MockTransport(handle)
    )
    with pytest.raises(RoutingUnavailable) as exc:
        asyncio.run(client.road_matrix(
            origin=(20, 80), destinations=[(21, 81)]
        ))
    assert secret not in str(exc.value)
    assert "limit" in str(exc.value).lower()


def test_missing_ors_key_is_explicit() -> None:
    with pytest.raises(RoutingNotConfigured):
        asyncio.run(OpenRouteServiceClient(api_key="").road_matrix(
            origin=(20, 80), destinations=[(21, 81)]
        ))


def test_invalid_matrix_is_rejected() -> None:
    def handle(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"distances": [], "durations": []})
    with pytest.raises(RoutingUnavailable):
        asyncio.run(OpenRouteServiceClient(
            api_key="fake-test-key", transport=httpx.MockTransport(handle)
        ).road_matrix(origin=(20, 80), destinations=[(21, 81)]))


def test_road_request_requires_matching_cost_inputs() -> None:
    with pytest.raises(ValidationError):
        _request(quantity_quintals="10")
    with pytest.raises(ValidationError):
        _request(cost_per_km="20")
    with pytest.raises(ValidationError):
        _request(latitude=200)
    with pytest.raises(ValidationError):
        _request(fixed_cost="500")


def test_comparison_preserves_latest_rate_and_costs(monkeypatch) -> None:
    verified_coords = {
        ("test state", "test district", "market a"): (20.1, 80.1),
        ("test state", "test district", "market b"): (20.2, 80.2),
    }
    monkeypatch.setattr(
        "app.services.road_comparison.read_verified_coordinates",
        lambda: verified_coords,
    )

    class StubClient:
        async def road_matrix(self, **kwargs: object) -> list[RoadMetric]:
            assert len(kwargs["destinations"]) == 2
            return [
                RoadMetric(distance_km=100, duration_minutes=180),
                RoadMetric(distance_km=50, duration_minutes=90),
            ]

    records = [
        _fixture("Market A", date(2026, 10, 17)),
        _fixture("Market A", date(2026, 10, 20)),
        _fixture("Market B", date(2026, 10, 19)),
    ]
    results, missing, present = asyncio.run(compare_roads(
        records, _request(
            quantity_quintals="10", cost_per_km="15", fixed_cost="200"
        ), client=StubClient(),
    ))
    assert present and missing == 0
    assert len(results) == 2
    assert results[0].observation.market == "Market B"
    assert results[0].estimate.net_proceeds == Decimal("24050.00")
    assert results[1].observation.arrival_date == date(2026, 10, 20)
    assert results[1].estimate.net_proceeds == Decimal("23300.00")


def test_road_endpoint_no_registry_requires_no_api_key(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.services.road_comparison.read_verified_coordinates",
        lambda: {},
    )
    response = TestClient(app).post("/api/v1/markets/road-compare", json={
        "state": "Test State", "commodity": "Wheat",
        "variety": "Dara", "grade": "FAQ",
        "latitude": 20, "longitude": 80,
    })
    assert response.status_code == 200
    assert response.json()["status"] == "coordinates_unavailable"
    assert response.json()["markets"] == []
