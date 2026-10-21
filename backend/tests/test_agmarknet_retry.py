"""Offline-only AGMARKNET retry tests with a fake response transport."""
import asyncio

import httpx
import pytest

from app.core.config import settings
from app.services.agmarknet import AgmarknetClient, DataGovError


def _run(transport: httpx.MockTransport) -> list[dict]:
    return asyncio.run(
        AgmarknetClient(
            api_key="mock-private-credential",
            transport=transport,
        ).fetch_page(limit=5)
    ).records


def test_retry_once_when_official_read_times_out(monkeypatch) -> None:
    calls = 0
    monkeypatch.setattr(settings, "data_gov_max_retries", 1)

    async def no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr("app.services.agmarknet.asyncio.sleep", no_sleep)

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        assert request.url.params["api-key"] == "mock-private-credential"
        assert request.url.params["limit"] == "5"
        if calls == 1:
            raise httpx.ReadTimeout("Simulated slow upstream", request=request)
        return httpx.Response(200, json={"records": [{"commodity": "Wheat"}], "total": 1})

    assert _run(httpx.MockTransport(handler)) == [{"commodity": "Wheat"}]
    assert calls == 2


def test_repeated_timeout_has_no_credential_in_message(monkeypatch) -> None:
    calls = 0
    monkeypatch.setattr(settings, "data_gov_max_retries", 1)

    async def no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr("app.services.agmarknet.asyncio.sleep", no_sleep)

    def handler(request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        raise httpx.ReadTimeout("Simulated unavailable server", request=request)

    with pytest.raises(DataGovError, match="did not respond") as error:
        _run(httpx.MockTransport(handler))
    assert calls == 2
    assert "mock-private-credential" not in str(error.value)


@pytest.mark.parametrize("status", [401, 403, 429])
def test_invalid_key_and_rate_limit_are_not_retried(
    status: int, monkeypatch
) -> None:
    calls = 0
    monkeypatch.setattr(settings, "data_gov_max_retries", 2)

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        return httpx.Response(status, json={"error": "ignored"})

    with pytest.raises(DataGovError) as error:
        _run(httpx.MockTransport(handler))
    assert calls == 1
    assert str(status) in str(error.value)
    assert "mock-private-credential" not in str(error.value)


def test_upstream_bad_gateway_is_retried(monkeypatch) -> None:
    calls = 0
    monkeypatch.setattr(settings, "data_gov_max_retries", 1)

    async def no_sleep(_seconds: float) -> None:
        return None

    monkeypatch.setattr("app.services.agmarknet.asyncio.sleep", no_sleep)

    def handler(_request: httpx.Request) -> httpx.Response:
        nonlocal calls
        calls += 1
        if calls == 1:
            return httpx.Response(503)
        return httpx.Response(200, json={"records": [], "total": 0})

    assert _run(httpx.MockTransport(handler)) == []
    assert calls == 2


def test_connect_timeout_has_specific_diagnostic(monkeypatch) -> None:
    monkeypatch.setattr(settings, "data_gov_max_retries", 0)

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectTimeout("Simulated unreachable endpoint", request=request)

    with pytest.raises(DataGovError, match="Cannot connect") as error:
        _run(httpx.MockTransport(handler))
    assert "mock-private-credential" not in str(error.value)
