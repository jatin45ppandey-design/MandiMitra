from datetime import date

import pytest

from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata
from scripts import export_offline_snapshot as exporter

def test_export_never_publishes_empty_data(tmp_path,monkeypatch):
    monkeypatch.setattr(exporter,"read_prices",lambda:MandiSnapshot(
        metadata=SnapshotMetadata(source="test",record_count=0,verified=False),records=[]))
    monkeypatch.setattr(exporter,"BACKEND_SNAPSHOT",tmp_path/"backend.json")
    monkeypatch.setattr(exporter,"FRONTEND_SNAPSHOT",tmp_path/"frontend.json")
    with pytest.raises(ValueError):
        exporter.export_verified()
    assert not (tmp_path/"backend.json").exists()

def test_export_keeps_true_reported_dates(tmp_path,monkeypatch):
    row=MarketPrice(state="UP",district="Lucknow",market="A",commodity="Wheat",
        arrival_date=date(2026,10,11),modal_price="2000")
    snap=MandiSnapshot(metadata=SnapshotMetadata(source="Official CSV",record_count=1,verified=True),records=[row])
    monkeypatch.setattr(exporter,"read_prices",lambda:snap)
    monkeypatch.setattr(exporter,"BACKEND_SNAPSHOT",tmp_path/"backend.json")
    monkeypatch.setattr(exporter,"FRONTEND_SNAPSHOT",tmp_path/"frontend.json")
    assert exporter.export_verified(offline_state="UP")== (1,1)
    assert '"2026-10-11"' in (tmp_path/"frontend.json").read_text()
