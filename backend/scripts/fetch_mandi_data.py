"""Fetch REAL official mandi records and atomically publish a checked snapshot.

Run from backend/:
    python -m scripts.fetch_mandi_data --state "Uttar Pradesh" --commodity "Wheat"
"""

import argparse
import asyncio
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from tempfile import NamedTemporaryFile

from app.schemas.prices import MandiSnapshot, SnapshotMetadata
from app.services.agmarknet import AgmarknetClient, DataGovError
from app.services.normalize import normalize_records

BACKEND_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_ROOT.parent
BACKEND_SNAPSHOT = BACKEND_ROOT / "data" / "snapshots" / "mandi-snapshot.json"
FRONTEND_SNAPSHOT = REPO_ROOT / "frontend" / "public" / "data" / "mandi-snapshot.json"


def _atomic_json_write(path: Path, payload: dict[str, object]) -> None:
    """Preserve last-known-good snapshot if any write fails before replacement."""
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path: Path | None = None
    try:
        with NamedTemporaryFile(
            mode="w", encoding="utf-8", dir=path.parent,
            suffix=".tmp", delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)
            json.dump(payload, temporary, indent=2, ensure_ascii=False, allow_nan=False)
            temporary.write("\n")
        os.replace(temporary_path, path)
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


async def import_prices(args: argparse.Namespace) -> MandiSnapshot:
    client = AgmarknetClient()
    fetched_at = datetime.now(UTC)
    raw_records: list[dict[str, object]] = []
    total: int | None = None
    exhausted = False

    for page_number in range(args.pages):
        offset = page_number * args.page_size
        page = await client.fetch_page(
            state=args.state,
            commodity=args.commodity,
            district=args.district,
            market=args.market,
            limit=args.page_size,
            offset=offset,
        )
        raw_records.extend(page.records)
        if page.total is not None:
            total = page.total
        if not page.records or len(page.records) < args.page_size:
            exhausted = True
            break
        if total is not None and offset + len(page.records) >= total:
            exhausted = True
            break

    clean, rejected = normalize_records(raw_records, fetched_at=fetched_at)
    if not clean:
        raise DataGovError(
            "No usable real government prices were returned. "
            "Existing snapshots were not overwritten."
        )

    requested_filters = {
        "state": args.state,
        "commodity": args.commodity,
    }
    if args.district:
        requested_filters["district"] = args.district
    if args.market:
        requested_filters["market"] = args.market

    return MandiSnapshot(
        metadata=SnapshotMetadata(
            source="data.gov.in / AGMARKNET (resource 9ef84268-d588-465a-a308-a864a43d0070)",
            fetched_at=fetched_at,
            latest_report_date=max(record.arrival_date for record in clean),
            record_count=len(clean),
            verified=True,
            partial=not exhausted,
            filters=requested_filters,
            rejected_records=rejected,
        ),
        records=clean,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Fetch live AGMARKNET prices using a private backend API key."
    )
    parser.add_argument("--state", required=True, help='e.g. "Uttar Pradesh"')
    parser.add_argument("--commodity", required=True, help='e.g. "Wheat"')
    parser.add_argument("--district", default=None, help="Optional exact district")
    parser.add_argument("--market", default=None, help="Optional exact mandi name")
    parser.add_argument("--page-size", type=int, default=100)
    parser.add_argument("--pages", type=int, default=5)
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Test the real API and validation without replacing any snapshot",
    )
    parser.add_argument(
        "--no-frontend-copy", action="store_true",
        help="Only write backend/data/snapshots",
    )
    result = parser.parse_args()
    if not 1 <= result.page_size <= 1000:
        parser.error("--page-size must be between 1 and 1000")
    if not 1 <= result.pages <= 20:
        parser.error("--pages must be between 1 and 20")
    return result


def main() -> None:
    args = parse_args()
    try:
        snapshot = asyncio.run(import_prices(args))
    except DataGovError as exc:
        raise SystemExit(f"Import stopped safely: {exc}") from None
    meta = snapshot.metadata
    print(
        f"Fetched {meta.record_count} real records. Latest reported date: "
        f"{meta.latest_report_date}. Rejected: {meta.rejected_records}. "
        f"Partial dataset: {meta.partial}."
    )
    distinct_dates = {record.arrival_date for record in snapshot.records}
    if len(distinct_dates) < 2:
        print(
            "Warning: fewer than two distinct reporting dates. "
            "Do not fabricate a historical trend."
        )
    if args.dry_run:
        print("Dry run: no snapshot files were changed.")
        return
    payload = snapshot.model_dump(mode="json")
    _atomic_json_write(BACKEND_SNAPSHOT, payload)
    print(f"Saved backend snapshot: {BACKEND_SNAPSHOT}")
    if not args.no_frontend_copy:
        _atomic_json_write(FRONTEND_SNAPSHOT, payload)
        print(f"Saved offline frontend snapshot: {FRONTEND_SNAPSHOT}")


if __name__ == "__main__":
    main()

