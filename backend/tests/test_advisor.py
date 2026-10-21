from datetime import date

from fastapi.testclient import TestClient

from app.api.v1 import advisor
from app.main import app
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata


def test_advisor_requires_verified_context(monkeypatch):
    empty = MandiSnapshot(
        metadata=SnapshotMetadata(source="test", record_count=0, verified=False), records=[]
    )
    monkeypatch.setattr(advisor, "read_prices", lambda: empty)
    payload = {"question": "What is my crop price?", "state": "UP", "district": "Lucknow",
               "commodity": "Wheat", "variety": "Dara", "grade": "FAQ"}
    response = TestClient(app).post("/api/v1/advisor/ask", json=payload)
    assert response.status_code == 422


def test_advisor_evidence_does_not_mix_grades(monkeypatch):
    good = MarketPrice(state="UP", district="Lucknow", market="A", commodity="Wheat",
                       variety="Dara", grade="FAQ", arrival_date=date(2026, 10, 20),
                       modal_price="2500")
    wrong = good.model_copy(update={"grade": "Other", "modal_price": 9000})
    snapshot = MandiSnapshot(
        metadata=SnapshotMetadata(source="test", record_count=2, verified=True),
        records=[good, wrong],
    )
    monkeypatch.setattr(advisor, "read_prices", lambda: snapshot)
    payload = advisor.AdvisorQuery(question="What is my crop price?", state="UP",
                                   district="Lucknow", commodity="Wheat",
                                   variety="Dara", grade="FAQ")
    evidence = advisor.collect_evidence(payload)
    assert len(evidence) == 1
    assert evidence[0].modal_price == 2500
