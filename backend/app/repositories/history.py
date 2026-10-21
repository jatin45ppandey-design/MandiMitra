"""SQLite-backed, appendable store of verified reported observations.

The existing JSON snapshot remains the offline/demo fallback. SQLite enables
multi-import history without requiring database credentials for the MVP.
"""
import json
import sqlite3
from pathlib import Path

from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata

DEFAULT_PATH = Path(__file__).resolve().parents[2] / "data" / "mandi-history.sqlite3"


class HistoryRepository:
    def __init__(self, path: Path = DEFAULT_PATH):
        self.path = path

    def _connect(self) -> sqlite3.Connection:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        db = sqlite3.connect(self.path)
        db.execute("""
            CREATE TABLE IF NOT EXISTS observations (
                identity TEXT PRIMARY KEY,
                report_date TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT NOT NULL,
                market TEXT NOT NULL,
                commodity TEXT NOT NULL,
                variety TEXT,
                grade TEXT,
                payload TEXT NOT NULL
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_observations_lookup ON observations (state, district, commodity, report_date)")
        db.commit()
        return db

    def import_snapshot(self, snapshot: MandiSnapshot) -> int:
        if not snapshot.metadata.verified:
            raise ValueError("Cannot persist unverified price observations")
        rows = []
        for record in snapshot.records:
            identity = json.dumps([
                record.state.casefold(), record.district.casefold(),
                record.market.casefold(), record.commodity.casefold(),
                (record.variety or "").casefold(), (record.grade or "").casefold(),
                record.arrival_date.isoformat(),
            ], ensure_ascii=False)
            rows.append((
                identity, record.arrival_date.isoformat(), record.state,
                record.district, record.market, record.commodity,
                record.variety, record.grade, record.model_dump_json(),
            ))
        with self._connect() as db:
            db.executemany("""
                INSERT INTO observations (
                    identity, report_date, state, district, market,
                    commodity, variety, grade, payload
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(identity) DO UPDATE SET payload=excluded.payload
            """, rows)
        return len(rows)

    def read(self) -> MandiSnapshot:
        if not self.path.exists():
            return MandiSnapshot(
                metadata=SnapshotMetadata(source="local history", record_count=0, verified=False),
                records=[],
            )
        with self._connect() as db:
            rows = db.execute("SELECT payload FROM observations ORDER BY report_date DESC").fetchall()
        records = [MarketPrice.model_validate_json(row[0]) for row in rows]
        return MandiSnapshot(
            metadata=SnapshotMetadata(
                source="Verified official observations stored locally",
                record_count=len(records), verified=bool(records),
                latest_report_date=max((r.arrival_date for r in records), default=None),
                partial=True,
            ),
            records=records,
        )
