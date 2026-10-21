"""Publish verified persisted records to the API snapshot and PWA fallback.

Run from backend/:
  python -m scripts.export_offline_snapshot --state "Uttar Pradesh" --limit 1200

Never marks an unverified observation as verified or creates prices.
"""
import argparse
from datetime import UTC, datetime

from app.repositories.prices import read_prices
from app.schemas.prices import MandiSnapshot, SnapshotMetadata
from scripts.fetch_mandi_data import BACKEND_SNAPSHOT, FRONTEND_SNAPSHOT, _atomic_json_write


def export_verified(*, offline_state: str | None = None, limit: int = 1200) -> tuple[int, int]:
    if not 1 <= limit <= 5000:
        raise ValueError("Offline limit must be 1..5000")
    source = read_prices()
    if not source.metadata.verified or not source.records:
        raise ValueError("No verified observations available. Existing snapshots preserved.")

    # Sort deterministically and retain exact reported dates, even when sparse.
    records = sorted(source.records, key=lambda r: (
        -r.arrival_date.toordinal(), r.state.casefold(), r.district.casefold(),
        r.commodity.casefold(), r.market.casefold(), (r.variety or "").casefold(),
        (r.grade or "").casefold()))
    if offline_state:
        offline_rows = [r for r in records if r.state.casefold() == offline_state.casefold()]
    else:
        offline_rows = records
    if not offline_rows:
        raise ValueError("No verified records in selected offline state; files untouched.")
    offline_rows = offline_rows[:limit]
    now = datetime.now(UTC)
    common = dict(source=source.metadata.source, fetched_at=now, verified=True, partial=True)
    full = MandiSnapshot(metadata=SnapshotMetadata(
        **common, record_count=len(records),
        latest_report_date=max(r.arrival_date for r in records),
        filters={"export": "persisted verified observations"}
    ), records=records)
    offline = MandiSnapshot(metadata=SnapshotMetadata(
        **common, record_count=len(offline_rows),
        latest_report_date=max(r.arrival_date for r in offline_rows),
        filters={"offline_state": offline_state or "all", "limit": str(limit)}
    ), records=offline_rows)
    # Validate BOTH data sets before publishing either, preventing invalid content.
    backend_payload = full.model_dump(mode="json")
    frontend_payload = offline.model_dump(mode="json")
    _atomic_json_write(BACKEND_SNAPSHOT, backend_payload)
    _atomic_json_write(FRONTEND_SNAPSHOT, frontend_payload)
    return len(records), len(offline_rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export verified stored mandi records to snapshots")
    parser.add_argument("--state", default=None, help="Optional offline subset state")
    parser.add_argument("--limit", type=int, default=1200)
    args = parser.parse_args()
    try:
        full, offline = export_verified(offline_state=args.state, limit=args.limit)
    except (ValueError, OSError, RuntimeError) as error:
        parser.exit(1, f"Export stopped: {error}\n")
    print(f"Published {full} backend records and {offline} genuine offline records.")


if __name__ == "__main__":
    main()
