"""Only verified known mandi points may appear in origin-picker data."""
from datetime import date

from fastapi.testclient import TestClient

from app.api.v1 import markets
from app.main import app
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata


def test_origin_picker_preserves_actual_market_names(monkeypatch):
    snapshot = MandiSnapshot(
        metadata=SnapshotMetadata(source="test fixture", record_count=1, verified=True),
        records=[MarketPrice(
            state="Uttar Pradesh", district="Lucknow", market="Mandi A",
            commodity="Wheat", variety="Dara", grade="FAQ",
            arrival_date=date(2026, 10, 20), modal_price=2500,
        )],
    )
    monkeypatch.setattr(markets, "read_prices", lambda: snapshot)
    monkeypatch.setattr(markets, "read_verified_coordinates", lambda: {
        ("uttar pradesh", "lucknow", "mandi a"): (26.8, 80.9),
        ("uttar pradesh", "lucknow", "unknown market"): (26.6, 80.5),
    })
    response = TestClient(app).get(
        "/api/v1/markets/origins", params={"state": "Uttar Pradesh"},
    )
    assert response.status_code == 200
    assert response.json()["items"] == [{
        "state": "Uttar Pradesh", "district": "Lucknow",
        "market": "Mandi A", "latitude": 26.8, "longitude": 80.9,
    }]
