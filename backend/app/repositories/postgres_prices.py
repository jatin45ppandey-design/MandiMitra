"""Persist normalized verified records into Supabase PostgreSQL."""
import json
from sqlalchemy import text

from app.db.postgres import engine
from app.schemas.prices import MandiSnapshot, MarketPrice, SnapshotMetadata


def _identity(row: MarketPrice) -> str:
    return json.dumps([
        row.state.casefold(), row.district.casefold(), row.market.casefold(),
        row.commodity.casefold(), (row.variety or "").casefold(),
        (row.grade or "").casefold(), row.arrival_date.isoformat(),
    ], ensure_ascii=False)


def import_verified(snapshot: MandiSnapshot) -> int:
    if not snapshot.metadata.verified:
        raise ValueError("Unverified prices must never enter the database")
    with engine().begin() as db:
        for item in snapshot.records:
            db.execute(text("""
                INSERT INTO mandi_observations
                (identity,state,district,market,commodity,variety,grade,
                 report_date,record,source)
                VALUES (:identity,:state,:district,:market,:commodity,:variety,
                        :grade,:report_date,CAST(:record AS jsonb),:source)
                ON CONFLICT (identity) DO UPDATE SET
                    record=EXCLUDED.record, source=EXCLUDED.source,
                    imported_at=mandi_observations.imported_at
            """), {
                "identity": _identity(item), "state": item.state,
                "district": item.district, "market": item.market,
                "commodity": item.commodity, "variety": item.variety,
                "grade": item.grade, "report_date": item.arrival_date,
                "record": item.model_dump_json(), "source": item.source,
            })
    return len(snapshot.records)


def load_verified() -> MandiSnapshot:
    with engine().connect() as db:
        rows = db.execute(text(
            "SELECT record FROM mandi_observations ORDER BY report_date DESC"
        )).scalars().all()
    records = [MarketPrice.model_validate(
        json.loads(value) if isinstance(value, str) else value
    ) for value in rows]
    return MandiSnapshot(metadata=SnapshotMetadata(
        source="Supabase PostgreSQL: verified official observations",
        verified=bool(records), record_count=len(records),
        latest_report_date=max((r.arrival_date for r in records), default=None),
        partial=True,
    ), records=records)
