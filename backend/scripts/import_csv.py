"""Import authentic, locally downloaded OGD CSV without any API key.

CSV columns are matched against the official AGMARKNET common names.
The operator must confirm the source file is genuinely downloaded from OGD.
"""
import argparse
import csv
from datetime import UTC, datetime
from pathlib import Path

from app.core.config import settings
from app.repositories.history import HistoryRepository
from app.schemas.prices import MandiSnapshot, SnapshotMetadata
from app.services.normalize import normalize_records


def import_csv(path: Path, *, source_url: str, dry_run: bool = False) -> tuple[int, int]:
    if not path.is_file():
        raise FileNotFoundError(path)
    if not source_url.startswith(("https://data.gov.in/", "https://www.data.gov.in/")):
        raise ValueError("Use the authentic data.gov.in download page URL")
    with path.open("r", encoding="utf-8-sig", newline="") as fh:
        rows = list(csv.DictReader(fh))
    if not rows:
        raise ValueError("CSV has no records; existing history preserved")
    records, rejected = normalize_records(rows, fetched_at=datetime.now(UTC))
    if not records:
        raise ValueError("No valid observations; existing history preserved")
    snapshot = MandiSnapshot(
        metadata=SnapshotMetadata(
            source=f"Manually downloaded CSV from {source_url}",
            record_count=len(records),
            latest_report_date=max(r.arrival_date for r in records),
            verified=True,
            partial=True,
            rejected_records=rejected,
        ),
        records=records,
    )
    if not dry_run:
        if settings.database_backend == 'postgres':
            from app.repositories.postgres_prices import import_verified
            import_verified(snapshot)
        else:
            HistoryRepository().import_snapshot(snapshot)
    return len(records), rejected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--file", type=Path, required=True)
    parser.add_argument("--source-url", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--offline-state", default=None, help="Filter bundled offline subset to one state")
    parser.add_argument("--offline-limit", type=int, default=3000)
    parser.add_argument("--no-export", action="store_true", help="Skip publishing verified snapshots")
    parser.add_argument(
        "--confirm-official-source", action="store_true",
        help="Confirm this file was downloaded directly from the stated official OGD page",
    )
    args = parser.parse_args()
    if not args.dry_run and not args.confirm_official_source:
        parser.error("Official source confirmation required for persistent import")
    accepted, rejected = import_csv(args.file, source_url=args.source_url, dry_run=args.dry_run)
    print(f"Validated {accepted} records, rejected {rejected}. Dry run: {args.dry_run}")
    if not args.dry_run and not args.no_export:
        from scripts.export_offline_snapshot import export_verified
        full, offline = export_verified(offline_state=args.offline_state, limit=args.offline_limit)
        print(f"Published {full} stored observations; {offline} genuine offline records.")


if __name__ == "__main__":
    main()
