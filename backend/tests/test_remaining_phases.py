from decimal import Decimal
from datetime import date
import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.prices import MarketPrice
from app.services.alert_engine import matches, hindi_digest
from app.services.earnings import TransportInput, calculate
from app.services.messaging import MockMessagingProvider, DisabledExternalProvider

client = TestClient(app)


def test_transport_calculation() -> None:
    result = calculate(TransportInput(
        rate_per_quintal="2500", quantity_quintals="10",
        transport_cost="1000", loading_cost="500", market_fees="100",
    ))
    assert result.gross_estimate == Decimal("25000")
    assert result.total_costs == Decimal("1600")
    assert result.net_estimate == Decimal("23400")


def test_transport_rejects_negative_cost() -> None:
    with pytest.raises(ValidationError):
        TransportInput(rate_per_quintal="2500", quantity_quintals="10",
                       transport_cost="-1")


def test_transport_http() -> None:
    result = client.post("/api/v1/transport/estimate", json={
        "rate_per_quintal": "2500", "quantity_quintals": "10",
        "transport_cost": "1000",
    })
    assert result.status_code == 200
    assert Decimal(str(result.json()["net_estimate"])) == Decimal("24000")


def test_alerts_require_authentication() -> None:
    assert client.get("/api/v1/alerts").status_code == 401
    assert client.get("/api/v1/notifications").status_code == 401


def test_matching_and_hindi_digest() -> None:
    record = MarketPrice(
        state="Uttar Pradesh", district="Lucknow", market="Market A",
        commodity="Wheat", variety="Dara", grade="FAQ",
        arrival_date=date(2026, 10, 20), modal_price=Decimal("2600"),
    )
    alert = dict(state="Uttar Pradesh", district="Lucknow",
                 market="Market A", commodity="Wheat", variety="Dara",
                 grade="FAQ", threshold=Decimal("2500"), direction="above")
    assert matches(alert, record)
    assert "2026-10-20" in hindi_digest(record)
    alert["direction"] = "below"
    assert not matches(alert, record)


def test_mock_delivery_cannot_claim_success() -> None:
    assert MockMessagingProvider().send("test", "message").status == "mock_only"
    with pytest.raises(RuntimeError):
        DisabledExternalProvider().send("test", "message")
