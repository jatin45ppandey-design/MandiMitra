"""Key-safe client for the official data.gov.in AGMARKNET resource."""

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
        state: str,
        commodity: str,
        district: str | None = None,
        market: str | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> DataGovPage:
        if not self.api_key or not self.api_key.strip():
            raise DataGovError(
                "Missing DATA_GOV_API_KEY: add it privately to backend/.env"
            )
        if not 1 <= limit <= 1000 or offset < 0:
            raise ValueError("Invalid pagination parameters")
        params: dict[str, str | int] = {
            "api-key": self.api_key,
            "format": "json",
            "limit": limit,
            "offset": offset,
            "filters[state.keyword]": state,
            "filters[commodity]": commodity,
        }
        if district:
            params["filters[district]"] = district
        if market:
            params["filters[market]"] = market

        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=httpx.Timeout(20.0, connect=8.0),
                follow_redirects=False,
            ) as client:
                response = await client.get(
                    f"{self.base_url}/resource/{self.resource_id}",
                    params=params,
                    headers={"Accept": "application/json"},
                )
                if response.status_code != 200:
                    raise DataGovError(
                        f"Government API returned HTTP {response.status_code}; "
                        "check key, filters or service status."
                    )
                payload = response.json()
        except DataGovError:
            raise
        except httpx.TimeoutException as exc:
            raise DataGovError("Government API timed out; try again or use a snapshot.") from exc
        except httpx.RequestError as exc:
            raise DataGovError("Government API connection failed; check network.") from exc
        except ValueError as exc:
            raise DataGovError("Government API did not return valid JSON.") from exc

        if not isinstance(payload, dict):
            raise DataGovError("Unexpected government API response structure.")
        records = payload.get("records")
        if not isinstance(records, list):
            # API can respond with HTTP 200 and a JSON error message.
            raise DataGovError("Government API returned no valid records list.")
        if any(not isinstance(item, dict) for item in records):
            raise DataGovError("Government API returned invalid record types.")
        total_raw = payload.get("total")
        try:
            total = int(total_raw) if total_raw is not None else None
        except (TypeError, ValueError):
            total = None
        return DataGovPage(records=records, total=total)

