"""Geographic (straight-line) mandi discovery from explicitly verified coordinates.

Never infer coordinates from market names. A verified registry must be supplied
separately; straight-line distance must not be called road distance.
"""
import csv
import math
from dataclasses import dataclass
from pathlib import Path

from app.schemas.prices import MarketPrice
from app.services.price_service import latest_per_market_and_variety

REGISTRY_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "reference" / "market-coordinates.csv"
)


@dataclass(frozen=True)
class NearbyMarket:
    record: MarketPrice
    distance_km: float


def _key(state: str, district: str, market: str) -> tuple[str, str, str]:
    return (state.strip().casefold(), district.strip().casefold(), market.strip().casefold())


def read_verified_coordinates(
    path: Path = REGISTRY_PATH,
) -> dict[tuple[str, str, str], tuple[float, float]]:
    """Only records with explicit source and verified=true are eligible."""
    if not path.exists():
        return {}
    output: dict[tuple[str, str, str], tuple[float, float]] = {}
    with path.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            if (row.get("verified") or "").strip().lower() != "true":
                continue
            if not (row.get("source_url") or "").startswith("https://"):
                continue
            try:
                lat, lon = float(row["latitude"]), float(row["longitude"])
            except (KeyError, TypeError, ValueError):
                continue
            if not (-90 <= lat <= 90 and -180 <= lon <= 180):
                continue
            key = _key(row.get("state") or "", row.get("district") or "", row.get("market") or "")
            if all(key):
                output[key] = (lat, lon)
    return output


def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0088
    a = math.sin(math.radians(lat2 - lat1) / 2) ** 2
    a += math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * (
        math.sin(math.radians(lon2 - lon1) / 2) ** 2
    )
    return 2 * radius_km * math.asin(min(1.0, math.sqrt(a)))


def find_nearby(
    records: list[MarketPrice],
    coordinates: dict[tuple[str, str, str], tuple[float, float]],
    *,
    latitude: float,
    longitude: float,
    radius_km: float,
    variety: str,
    grade: str,
) -> list[NearbyMarket]:
    matches = latest_per_market_and_variety([
        r for r in records
        if (r.variety or "").casefold() == variety.casefold()
        and (r.grade or "").casefold() == grade.casefold()
    ])
    nearby: list[NearbyMarket] = []
    for record in matches:
        location = coordinates.get(_key(record.state, record.district, record.market))
        if location is None:
            continue
        distance = _haversine(latitude, longitude, *location)
        if distance <= radius_km:
            nearby.append(NearbyMarket(record=record, distance_km=round(distance, 2)))
    return sorted(nearby, key=lambda x: (x.distance_km, x.record.market.casefold()))
