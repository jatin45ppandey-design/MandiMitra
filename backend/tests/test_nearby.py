"""The locations here are invented test fixtures and never official market locations."""
from datetime import date
from decimal import Decimal

from app.schemas.prices import MarketPrice
from app.services.nearby import find_nearby, read_verified_coordinates


def record(market: str, when: date) -> MarketPrice:
    return MarketPrice(
        state="Test State", district="Test District", market=market,
        commodity="Wheat", variety="Dara", grade="FAQ",
        arrival_date=when, modal_price=Decimal(2200),
    )


def test_only_verified_coordinates_used(tmp_path) -> None:
    path = tmp_path / "coords.csv"
    path.write_text(
        "state,district,market,latitude,longitude,verified,source_url\n"
        "Test State,Test District,Market A,20,80,true,https://example.org/a\n"
        "Test State,Test District,Market B,21,81,false,https://example.org/b\n",
        encoding="utf-8",
    )
    coords = read_verified_coordinates(path)
    assert len(coords) == 1
    rows = [
        record("Market A", date(2026, 10, 19)),
        record("Market A", date(2026, 10, 20)),
        record("Market B", date(2026, 10, 20)),
    ]
    result = find_nearby(
        rows, coords, latitude=20, longitude=80,
        radius_km=10, variety="Dara", grade="FAQ",
    )
    assert len(result) == 1
    assert result[0].record.market == "Market A"
    assert result[0].record.arrival_date == date(2026, 10, 20)
    assert result[0].distance_km == 0


def test_no_registry_has_no_fake_nearby_results(tmp_path) -> None:
    assert read_verified_coordinates(tmp_path / "missing.csv") == {}
