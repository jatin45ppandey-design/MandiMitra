"""Key-safe client for the official data.gov.in AGMARKNET resource."""

import asyncio
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.config import settings


class DataGovError(Exception):
    """Sanitized API error; never includes the credential-bearing request URL."""


@dataclass(frozen=True)
class DataGovPage:
    records: list[dict[str, Any]]
    total: int | None


class AgmarknetClient:
    def __init__(
        self,
        api_key: str | None = None,
        base_url: str | None = None,
        resource_id: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.api_key = api_key if api_key is not None else settings.data_gov_api_key
        self.base_url = (base_url or settings.data_gov_base_url).rstrip("/")
        self.resource_id = resource_id or settings.agmarknet_resource_id
        self.transport = transport

    async def fetch_page(
        self,
        *,
        state: str | None = None,
        commodity: str | None = None,
        district: str | None = None,
        market: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> DataGovPage:
        if not self.api_key or not self.api_key.strip():
            raise DataGovError("Missing DATA_GOV_API_KEY: add it privately to backend/.env")
        if not 1 <= limit <= 1000 or offset < 0:
            raise ValueError("Invalid pagination parameters")

        params: dict[str, str | int] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "offset": offset,
        }
        if state:
            params["filters[state.keyword]"] = state
        if commodity:
            params["filters[commodity]"] = commodity
        if district:
            params["filters[district]"] = district
        if market:
            params["filters[market]"] = market

        timeout = settings.data_gov_timeout_seconds
        retries = settings.data_gov_max_retries

        async with httpx.AsyncClient(
            transport=self.transport,
            timeout=httpx.Timeout(timeout, connect=min(8.0, timeout)),
            follow_redirects=False,
        ) as client:
            for attempt in range(retries + 1):
                try:
                    response = await client.get(
                        f"{self.base_url}/resource/{self.resource_id}",
                        params=params,
                        headers={"Accept": "application/json"},
                    )
                except httpx.ConnectTimeout as exc:
                    if attempt < retries:
                        await asyncio.sleep(min(2**attempt, 4))
                        continue
                    raise DataGovError(
                        "Cannot connect to government API before timeout. "
                        "Check DNS, firewall, proxy or connection."
                    ) from exc
                except httpx.ReadTimeout as exc:
                    if attempt < retries:
                        await asyncio.sleep(min(2**attempt, 4))
                        continue
                    raise DataGovError(
                        f"Government API did not respond within {timeout:g} seconds per "
                        f"attempt ({retries + 1} attempt(s)). "
                        "Service may be slow or unavailable; try a smaller page later."
                    ) from exc
                except httpx.TimeoutException as exc:
                    if attempt < retries:
                        await asyncio.sleep(min(2**attempt, 4))
                        continue
                    raise DataGovError(
                        "Government API timed out after retry; try again later."
                    ) from exc
                except httpx.RequestError as exc:
                    raise DataGovError(
                        "Government API connection failed; check network, TLS or proxy."
                    ) from exc

                if response.status_code in (502, 503, 504) and attempt < retries:
                    await asyncio.sleep(min(2**attempt, 4))
                    continue
                if response.status_code in (401, 403):
                    raise DataGovError(
                        f"Government API returned HTTP {response.status_code}; "
                        "verify this key has access to the selected resource."
                    )
                if response.status_code == 429:
                    raise DataGovError(
                        "Government API returned HTTP 429 (rate limit); "
                        "wait before retrying."
                    )
                if response.status_code != 200:
                    raise DataGovError(
                        f"Government API returned HTTP {response.status_code}; "
                        "check the resource and service status."
                    )

                try:
                    payload = response.json()
                except ValueError as exc:
                    raise DataGovError(
                        "Government API did not return valid JSON."
                    ) from exc
                if not isinstance(payload, dict):
                    raise DataGovError("Unexpected government API response structure.")
                records = payload.get("records")
                if not isinstance(records, list):
                    raise DataGovError("Government API returned no valid records list.")
                if any(not isinstance(item, dict) for item in records):
                    raise DataGovError("Government API returned invalid record types.")
                total_raw = payload.get("total")
                try:
                    total = int(total_raw) if total_raw is not None else None
                except (TypeError, ValueError):
                    total = None
                return DataGovPage(records=records, total=total)

        raise DataGovError("Government API was not available after retries.")
