"""No real pricing data is needed for the catalog-sync and coverage tests."""
import asyncio
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.agmarknet import AgmarknetClient
from scripts.sync_mandi_catalog import _offline_subset, sync


def test_unfiltered_catalog_request_does_not_restrict_crop_or_state() -> None:
    async def handler(req: httpx.Request) -> httpx.Response:
        assert "filters[state.keyword]" not in req.url.params
        assert "filters[commodity]" not in req.url.params
        return httpx.Response(200, json={"records": [], "total": 0})

    client = AgmarknetClient(
        api_key="fake-test-key", transport=httpx.MockTransport(handler)
    )
    result = asyncio.run(client.fetch_page(limit=10))
    assert result.records == []


def test_catalog_dry_run_uses_real_row_format(monkeypatch) -> None:
    report_date = (datetime.now(UTC).date() - timedelta(days=1)).strftime("%d/%m/%Y")

    class FakeClient:
        async def fetch_page(self, **kwargs: object) -> SimpleNamespace:
            return SimpleNamespace(total=1, records=[{
                "state": "Test State", "district": "Test District",
                "market": "Test Market", "commodity": "Wheat",
                "variety": "Dara", "grade": "FAQ",
                "arrival_date": report_date, "min_price": "2100",
                "max_price": "2300", "modal_price": "2200",
            }])

    monkeypatch.setattr(
        "scripts.sync_mandi_catalog.AgmarknetClient", FakeClient,
    )
    snapshot = asyncio.run(sync(page_size=100, max_pages=2))
    assert snapshot.metadata.verified
    assert snapshot.metadata.record_count == 1
    assert snapshot.metadata.latest_report_date.isoformat() == (
        datetime.now(UTC).date() - timedelta(days=1)
    ).isoformat()
    assert snapshot.metadata.partial is False


def test_offline_subset_keeps_only_official_selected_state(monkeypatch) -> None:
    report_date = (datetime.now(UTC).date() - timedelta(days=1)).strftime("%d/%m/%Y")

    class FakeClient:
        async def fetch_page(self, **kwargs: object) -> SimpleNamespace:
            return SimpleNamespace(total=1, records=[{
                "state": "Test State", "district": "Test District",
                "market": "Test Market", "commodity": "Wheat",
                "variety": "Dara", "grade": "FAQ",
                "arrival_date": report_date, "min_price": "2100",
                "max_price": "2300", "modal_price": "2200",
            }])

    monkeypatch.setattr(
        "scripts.sync_mandi_catalog.AgmarknetClient", FakeClient,
    )
    snapshot = asyncio.run(sync(page_size=10, max_pages=1))
    subset = _offline_subset(snapshot, state="Test State", limit=10)
    assert len(subset.records) == 1
    assert subset.metadata.filters["state"] == "Test State"
    with pytest.raises(ValueError):
        _offline_subset(snapshot, state="Different State", limit=10)


def test_data_coverage_when_snapshot_is_empty() -> None:
    response = TestClient(app).get("/api/v1/data/coverage")
    assert response.status_code == 200
    payload = response.json()
    assert "verified_market_coordinates" in payload
    assert "record_count" in payload
