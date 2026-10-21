from datetime import date
from decimal import Decimal

from app.schemas.prices import MarketPrice
from app.schemas.road_comparison import RoadEstimate, RoadMarketResult
from app.services.net_decision import build_decision


def item(day, market, price, net):
    return RoadMarketResult(
        observation=MarketPrice(state="UP", district="Lucknow", market=market,
                                commodity="Wheat", variety="Dara", grade="FAQ",
                                arrival_date=date(2026, 10, day), modal_price=price),
        distance_km=10, duration_minutes=20, route_status="available",
        estimate=RoadEstimate(
            gross_proceeds=Decimal("50000"), transport_cost=Decimal("500"),
            net_proceeds=Decimal(str(net)),
        ),
    )


def test_old_high_price_cannot_win():
    outcome = build_decision(
        [item(5, "Stale", "3500", 60000), item(20, "Recent", "2400", 47000)],
        today=date(2026, 10, 21),
    )
    assert outcome.status == "ok"
    assert outcome.best_market == "Recent"
    assert outcome.markets[1].eligible is False


def test_no_fresh_records_returns_no_recommendation():
    outcome = build_decision(
        [item(4, "Stale", "3500", 60000)], today=date(2026, 10, 21),
    )
    assert outcome.status == "insufficient_fresh_data"
    assert outcome.best_market is None
