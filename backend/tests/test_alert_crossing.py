from datetime import date
from decimal import Decimal

from app.schemas.prices import MarketPrice
from app.services.alert_engine import crosses


def observation(value: str) -> MarketPrice:
    return MarketPrice(state="UP", district="Lucknow", market="A",
                       commodity="Wheat", variety="Dara", grade="FAQ",
                       arrival_date=date(2026, 10, 20), modal_price=Decimal(value))


def test_alert_only_triggers_on_crossing():
    alert = {"state": "UP", "district": "Lucknow", "market": "A",
             "commodity": "Wheat", "variety": "Dara", "grade": "FAQ",
             "threshold": Decimal("2500"), "direction": "above"}
    assert crosses(alert, observation("2400"), observation("2600"))
    assert not crosses(alert, observation("2550"), observation("2600"))
    assert not crosses(alert, None, observation("2600"))
