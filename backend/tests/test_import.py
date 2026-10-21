import asyncio
from datetime import datetime, timezone
from decimal import Decimal

import httpx
import pytest

from app.schemas.prices import MandiSnapshot, SnapshotMetadata
from app.services.agmarknet import AgmarknetClient, DataGovError
from app.services.normalize import normalize_record, normalize_records


def sample_row(**overrides: str) -> dict[str, str]:
    result = {
        "state": "Uttar Pradesh",
        "district": "Lucknow",
        "market": "Lucknow",
        "commodity": "Wheat",
        "variety": "Dara",
        "grade": "FAQ",
        "arrival_date": "20/10/2026",
        "min_price": "2200",
        "max_price": "2400",
        "modal_price": "2300",
    }
    result.update(overrides)
    return result


def test_clean_government_record_keeps_reporting_date() -> None:
    fetched = datetime(2026, 10, 21, tzinfo=timezone.utc)
    record = normalize_record(sample_row(), fetched_at=fetched)
    assert record.arrival_date.isoformat() == "2026-10-20"
    assert record.modal_price == Decimal(2300)
    assert record.grade == "FAQ"
    assert record.fetched_at == fetched


def test_invalid_and_future_dates_are_rejected() -> None:
    fetched = datetime.now(timezone.utc)
    with pytest.raises(ValueError):
        normalize_record(sample_row(arrival_date="not-a-date"), fetched_at=fetched)
    with pytest.raises(ValueError):
        normalize_record(sample_row(arrival_date="31/12/2099"), fetched_at=fetched)


def test_missing_price_not_invented() -> None:
    with pytest.raises(ValueError):
        normalize_record(
            sample_row(modal_price="-"),
            fetched_at=datetime.now(timezone.utc),
        )


def test_duplicate_and_bad_rows() -> None:
    fetched = datetime.now(timezone.utc)
    accepted, rejected = normalize_records(
        [sample_row(), sample_row(), sample_row(modal_price="NA")],
        fetched_at=fetched,
    )
    assert len(accepted) == 1
    assert rejected == 1


def test_snapshot_serializes_numeric_prices_for_frontend() -> None:
    fetched = datetime.now(timezone.utc)
    record = normalize_record(sample_row(), fetched_at=fetched)
    snapshot = MandiSnapshot(
        metadata=SnapshotMetadata(
            source="AGMARKNET", fetched_at=fetched,
            latest_report_date=record.arrival_date, record_count=1,
            verified=True,
        ),
        records=[record],
    )
    assert snapshot.model_dump(mode="json")["records"][0]["modal_price"] == 2300.0


def test_api_client_filters_and_does_not_log_key() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["filters[state.keyword]"] == "Uttar Pradesh"
        assert request.url.params["filters[commodity]"] == "Wheat"
        assert request.url.params["api-key"] == "secret-for-test"
        return httpx.Response(200, json={"records": [sample_row()], "total": 1})

    client = AgmarknetClient(
        api_key="secret-for-test",
        transport=httpx.MockTransport(handler),
    )
    page = asyncio.run(client.fetch_page(state="Uttar Pradesh", commodity="Wheat"))
    assert page.total == 1
    assert len(page.records) == 1


def test_api_errors_are_sanitized() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(403, json={"message": "access denied"})

    client = AgmarknetClient(
        api_key="secret-for-test",
        transport=httpx.MockTransport(handler),
    )
    with pytest.raises(DataGovError) as exc_info:
        asyncio.run(client.fetch_page(state="Uttar Pradesh", commodity="Wheat"))
    assert "secret-for-test" not in str(exc_info.value)
    assert "403" in str(exc_info.value)

