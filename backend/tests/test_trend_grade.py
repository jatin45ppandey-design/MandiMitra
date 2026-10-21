"""Correct trends for explicit grades, missing dates and actual observations."""
from datetime import date
from decimal import Decimal

from fastapi.testclient import TestClient

from app.api.v1 import trends
from app.main import app
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata

def row(day: int, grade: str, price: str) -> MarketPrice:
    return MarketPrice(state="Uttar Pradesh", district="Lucknow", market="Market A",
        commodity="Wheat", variety="Dara", grade=grade, arrival_date=date(2026,10,day),
        modal_price=Decimal(price))

def test_trends_filter_grade_and_preserve_gap(monkeypatch):
    rows=[row(11,"FAQ","2000"),row(13,"FAQ","2200"),row(12,"Other","2500")]
    snap=MandiSnapshot(metadata=SnapshotMetadata(source="test",record_count=3,verified=True),records=rows)
    monkeypatch.setattr(trends,"read_prices",lambda:snap)
    data=TestClient(app).get("/api/v1/trends",params={"state":"Uttar Pradesh","district":"Lucknow",
        "commodity":"Wheat","market":"Market A","variety":"Dara","grade":"FAQ"}).json()
    assert [x["report_date"] for x in data["observations"]]==["2026-10-11","2026-10-13"]
    assert [str(x["modal_price"]) for x in data["observations"]]==["2000","2200"]
