"""Import genuinely reported mandi prices for many states/crops in one run.

The official resource is queried without commodity/state filters. This avoids
accidentally limiting the app to a single crop. No record is fabricated.
Run from backend/: python -m scripts.sync_mandi_catalog --dry-run
"""
import argparse
import asyncio
from datetime import UTC, datetime

from app.core.config import settings
from app.repositories.history import HistoryRepository
from app.schemas.prices import MandiSnapshot, SnapshotMetadata
from app.services.agmarknet import AgmarknetClient, DataGovError
from app.services.normalize import normalize_records


async def sync(
    *,
    page_size: int = 1000,
    max_pages: int = 25,
) -> MandiSnapshot:
    if not 1 <= page_size <= 1000 or not 1 <= max_pages <= 250:
        raise ValueError("page_size or max_pages outside permitted range")
    client = AgmarknetClient()
    fetched_at = datetime.now(UTC)
    rows: list[dict] = []
    exhausted = False
    total = None

    for page in range(max_pages):
        part = await client.fetch_page(limit=page_size, offset=page * page_size)
        rows.extend(part.records)
        total = part.total if part.total is not None else total
        if not part.records or len(part.records) < page_size:
            exhausted = True
            break
        if total is not None and len(rows) >= total:
            exhausted = True
            break

    clean, rejected = normalize_records(rows, fetched_at=fetched_at)
    if not clean:
        raise DataGovError(
            "No valid official mandi records returned. Previous data preserved."
        )
    return MandiSnapshot(
        metadata=SnapshotMetadata(
            source=f"data.gov.in / AGMARKNET (resource {settings.agmarknet_resource_id})",
            fetched_at=fetched_at,
            latest_report_date=max(row.arrival_date for row in clean),
            record_count=len(clean),
            verified=True,
            partial=not exhausted,
            rejected_records=rejected,
        ),
        records=clean,
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync official AGMARKNET market observations")
    parser.add_argument("--page-size", type=int, default=1000)
    parser.add_argument("--max-pages", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--offline-state",
        help="Optionally package real records from one state for offline PWA use",
    )
    parser.add_argument("--offline-limit", type=int, default=3000)
    args = parser.parse_args()
    if not 1 <= args.page_size <= 1000 or not 1 <= args.max_pages <= 250:
        parser.error("Invalid pagination bounds")
    if not 1 <= args.offline_limit <= 5000:
        parser.error("--offline-limit must be between 1 and 2000")
    try:
        snapshot = asyncio.run(sync(page_size=args.page_size, max_pages=args.max_pages))
    except DataGovError as exc:
        raise SystemExit(f"Sync stopped safely: {exc}") from None
    metadata = snapshot.metadata
    print(
        f"Official records: {metadata.record_count}; rejected: {metadata.rejected_records}; "
        f"latest report: {metadata.latest_report_date}; partial: {metadata.partial}"
    )
    if args.dry_run:
        print("Dry run: no files or database modified.")
        return

    # Import first. Never discard the last verified data on a failed fetch.
    if settings.database_backend == "postgres":
        from app.repositories.postgres_prices import import_verified
        import_verified(snapshot)
    elif settings.database_backend == "snapshot":
        HistoryRepository().import_snapshot(snapshot)
    else:
        raise SystemExit("DATABASE_BACKEND must be postgres or snapshot")

    # Export from cumulative verified history, rather than only today's API page.
    # This keeps genuinely reported multi-day trends available in the offline PWA.
    from scripts.export_offline_snapshot import export_verified

    full, offline = export_verified(
        offline_state=args.offline_state, limit=args.offline_limit,
    )
    print(f"Published {full} cumulative verified records and {offline} offline records.")



if __name__ == "__main__":
    main()
