from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint() -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "mandimitra-api"}


def test_no_synthetic_price_records() -> None:
    response = client.get("/api/v1/prices")
    assert response.status_code == 200
    payload = response.json()
    assert payload["records"] == []
    assert payload["verified"] is False


def test_empty_reference_data() -> None:
    response = client.get("/api/v1/commodities")
    assert response.status_code == 200
    assert response.json() == {"items": []}


def test_trend_missing_data_is_honest() -> None:
    response = client.get(
        "/api/v1/trends",
        params={
            "commodity": "Wheat",
            "state": "Uttar Pradesh",
            "district": "Lucknow",
            "market": "Lucknow"
        },
    )
    assert response.status_code == 200
    assert response.json()["observations"] == []

