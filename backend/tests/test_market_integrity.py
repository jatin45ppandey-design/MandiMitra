"""Regression tests for price comparisons; all rates here are synthetic fixtures."""

from datetime import date
from decimal import Decimal

from app.schemas.prices import MarketPrice
from app.services.price_service import latest_per_market_and_variety


def record(market: str, variety: str, when: date, rate: int, grade: str = "FAQ") -> MarketPrice:
    return MarketPrice(
        state="Uttar Pradesh",
        district="Lucknow",
        market=market,
        commodity="Wheat",
        variety=variety,
        grade=grade,
        arrival_date=when,
        modal_price=Decimal(rate),
        source="synthetic test fixture",
    )


def test_latest_price_per_market_and_variety() -> None:
    rows = [
        record("Mandi A", "Dara", date(2026, 10, 18), 2100),
        record("Mandi A", "Dara", date(2026, 10, 20), 2200),
        record("Mandi A", "Other", date(2026, 10, 19), 2400),
        record("Mandi B", "Dara", date(2026, 10, 17), 2300),
    ]
    result = latest_per_market_and_variety(rows)
    assert len(result) == 3
    assert {(r.market, r.variety, r.modal_price) for r in result} == {
        ("Mandi A", "Dara", Decimal(2200)),
        ("Mandi A", "Other", Decimal(2400)),
        ("Mandi B", "Dara", Decimal(2300)),
    }


def test_grade_kept_distinct() -> None:
    rows = [
        record("Mandi A", "Dara", date(2026, 10, 20), 2200, "FAQ"),
        record("Mandi A", "Dara", date(2026, 10, 20), 2300, "Other"),
    ]
    assert len(latest_per_market_and_variety(rows)) == 2
