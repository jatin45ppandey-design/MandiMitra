"""Tests use fabricated test fixtures exclusively, never production mandi rates."""
import csv
from datetime import UTC, date, datetime
from decimal import Decimal

import pytest

from app.repositories.history import HistoryRepository
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata
from app.services.market_comparison import compare_same_district, freshness_days
from scripts.import_csv import import_csv


def fixture(market: str, when: date, variety: str = "Dara", grade: str = "FAQ") -> MarketPrice:
    return MarketPrice(
        state="Uttar Pradesh", district="Lucknow", market=market,
        commodity="Wheat", variety=variety, grade=grade,
        arrival_date=when, min_price=Decimal(2100), modal_price=Decimal(2200),
        max_price=Decimal(2300), fetched_at=datetime.now(UTC),
    )


def snapshot(rows: list[MarketPrice]) -> MandiSnapshot:
    return MandiSnapshot(
        metadata=SnapshotMetadata(source="test", verified=True, record_count=len(rows)),
        records=rows,
    )


def test_history_accumulates_and_deduplicates(tmp_path) -> None:
    repo = HistoryRepository(tmp_path / "history.db")
    first = snapshot([fixture("Market A", date(2026, 10, 19))])
    second = snapshot([fixture("Market A", date(2026, 10, 20))])
    repo.import_snapshot(first)
    repo.import_snapshot(first)
    repo.import_snapshot(second)
    result = repo.read()
    assert result.metadata.verified
    assert result.metadata.record_count == 2
    assert result.metadata.latest_report_date == date(2026, 10, 20)


def test_history_rejects_unverified(tmp_path) -> None:
    repo = HistoryRepository(tmp_path / "history.db")
    with pytest.raises(ValueError):
        repo.import_snapshot(MandiSnapshot(
            metadata=SnapshotMetadata(source="unknown", record_count=1, verified=False),
            records=[fixture("Market A", date(2026, 10, 20))],
        ))


def test_market_comparison_preserves_dates_and_distinct_markets() -> None:
    rows = [
        fixture("Market A", date(2026, 10, 19)),
        fixture("Market A", date(2026, 10, 20)),
        fixture("Market B", date(2026, 10, 17)),
        fixture("Market C", date(2026, 10, 20), variety="Other"),
    ]
    result = compare_same_district(rows, variety="Dara", grade="FAQ")
    assert len(result) == 2
    assert {r.market: r.arrival_date for r in result} == {
        "Market A": date(2026, 10, 20),
        "Market B": date(2026, 10, 17),
    }
    assert freshness_days(result[1], as_of=date(2026, 10, 21)) >= 1


def test_csv_dry_run_does_not_create_history(tmp_path, monkeypatch) -> None:
    path = tmp_path / "official-sample.csv"
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=[
            "state", "district", "market", "commodity", "variety",
            "grade", "arrival_date", "min_price", "max_price", "modal_price",
        ])
        writer.writeheader()
        writer.writerow(dict(
            state="Uttar Pradesh", district="Lucknow", market="Market A",
            commodity="Wheat", variety="Dara", grade="FAQ",
            arrival_date="20/10/2026", min_price="2100", max_price="2300",
            modal_price="2200",
        ))
    db_path = tmp_path / "history.sqlite3"
    monkeypatch.setattr(
        "scripts.import_csv.HistoryRepository",
        lambda: HistoryRepository(db_path),
    )
    accepted, rejected = import_csv(
        path, source_url="https://data.gov.in/catalog/current-daily-price-various-commodities-various-markets-mandi",
        dry_run=True,
    )
    assert (accepted, rejected) == (1, 0)
    assert not db_path.exists()
