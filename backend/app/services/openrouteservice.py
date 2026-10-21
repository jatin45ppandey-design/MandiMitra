"""OpenRouteService road matrix adapter.

All coordinates passed to ORS are [longitude, latitude]. Secrets stay in the
server-side Authorization header, never a frontend URL, response, or log.
"""
from dataclasses import dataclass
import math

import httpx

from app.core.config import settings

ORS_MATRIX_URL = "https://api.openrouteservice.org/v2/matrix/driving-car"


class RoutingUnavailable(Exception):
    """Sanitized routing failure safe to show to callers."""


class RoutingNotConfigured(RoutingUnavailable):
    """No private OpenRouteService key has been configured."""


@dataclass(frozen=True)
class RoadMetric:
    distance_km: float | None
    duration_minutes: float | None


def _metric(value: object) -> float | None:
    if value is None or isinstance(value, bool) or not isinstance(value, (int, float)):
        raise RoutingUnavailable("Routing service returned invalid distance or duration")
    if not math.isfinite(value) or value < 0:
        raise RoutingUnavailable("Routing service returned invalid distance or duration")
    return float(value)


class OpenRouteServiceClient:
    def __init__(
        self,
        *,
        api_key: str | None = None,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> None:
        self.api_key = settings.openrouteservice_api_key if api_key is None else api_key
        self.transport = transport

    async def road_matrix(
        self,
        *,
        origin: tuple[float, float],
        destinations: list[tuple[float, float]],
    ) -> list[RoadMetric]:
        """One farmer origin to up to eight mandi locations.

        Tuples are (latitude, longitude); ORS receives [longitude, latitude].
        Returned road distances are km, durations are minutes.
        """
        if not destinations:
            return []
        if len(destinations) > 8:
            raise ValueError("Too many mandi destinations")
        if not self.api_key or self.api_key.startswith("REPLACE_"):
            raise RoutingNotConfigured("OpenRouteService API key not configured")

        locations = [
            [origin[1], origin[0]],
            *[[longitude, latitude] for latitude, longitude in destinations],
        ]
        try:
            async with httpx.AsyncClient(
                transport=self.transport,
                timeout=httpx.Timeout(18.0, connect=6.0),
                follow_redirects=False,
            ) as client:
                response = await client.post(
                    ORS_MATRIX_URL,
                    headers={
                        "Authorization": self.api_key,
                        "Accept": "application/json",
                        "Content-Type": "application/json",
                    },
                    json={
                        "locations": locations,
                        "sources": ["0"],
                        "destinations": [str(i) for i in range(1, len(locations))],
                        "metrics": ["distance", "duration"],
                        "units": "km",
                    },
                )
            if response.status_code == 429:
                raise RoutingUnavailable("Routing limit reached; try again later")
            if response.status_code != 200:
                raise RoutingUnavailable(
                    f"Routing service unavailable (HTTP {response.status_code})"
                )
            payload = response.json()
        except RoutingUnavailable:
            raise
        except (httpx.TimeoutException, httpx.RequestError) as exc:
            raise RoutingUnavailable("Routing service network error or timeout") from exc
        except ValueError as exc:
            raise RoutingUnavailable("Routing service returned invalid JSON") from exc

        if not isinstance(payload, dict):
            raise RoutingUnavailable("Routing service returned invalid response")
        distances = payload.get("distances")
        durations = payload.get("durations")
        if (
            not isinstance(distances, list) or len(distances) != 1
            or not isinstance(durations, list) or len(durations) != 1
            or not isinstance(distances[0], list)
            or not isinstance(durations[0], list)
            or len(distances[0]) != len(destinations)
            or len(durations[0]) != len(destinations)
        ):
            raise RoutingUnavailable("Routing service returned invalid matrix shape")

        result: list[RoadMetric] = []
        for distance, duration in zip(distances[0], durations[0], strict=True):
            # ORS uses null when no drivable route is found for a destination.
            if distance is None or duration is None:
                result.append(RoadMetric(distance_km=None, duration_minutes=None))
                continue
            d_km = _metric(distance)
            d_sec = _metric(duration)
            result.append(RoadMetric(distance_km=d_km, duration_minutes=d_sec / 60))
        return result
