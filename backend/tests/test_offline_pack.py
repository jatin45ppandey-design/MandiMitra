from datetime import date

import pytest

from app.schemas.prices import MarketPrice
from app.services.offline_pack import balanced_offline_records


def row(market: str, day: int) -> MarketPrice:
    return MarketPrice(
        state="Uttar Pradesh", district="Lucknow", commodity="Wheat",
        market=market, variety="Dara", grade="FAQ",
        arrival_date=date(2026, 10, day), modal_price=2300,
    )


def test_balanced_offline_export_preserves_multiple_market_histories():
    records = [row("A", d) for d in (19, 18, 17, 16)] + [row("B", d) for d in (19, 18)]
    selected = balanced_offline_records(records, limit=4, state="Uttar Pradesh")
    assert {r.market for r in selected} == {"A", "B"}
    assert {r.arrival_date for r in selected if r.market == "B"} == {
        date(2026, 10, 18), date(2026, 10, 19),
    }
    assert all(r.modal_price == 2300 for r in selected)


def test_no_unknown_state_can_be_fabricated():
    with pytest.raises(ValueError):
        balanced_offline_records([row("A", 19)], limit=100, state="Unknown")


def test_offline_limit_is_bounded():
    with pytest.raises(ValueError):
        balanced_offline_records([row("A", 19)], limit=5001)
