"""Build unverified coordinate candidates from genuine stored mandi identities.

No geocoding or guessed district-center coordinates are permitted.
"""
import argparse
import csv
from pathlib import Path

from app.repositories.prices import read_prices

FIELDS = ("state", "district", "market", "latitude", "longitude", "verified", "source_url")


def generate_candidates(path: Path, state: str | None = None) -> int:
    snapshot = read_prices()
    if not snapshot.metadata.verified or not snapshot.records:
        raise ValueError("Import genuine mandi observations before generating candidates")
    identities = sorted({
        (r.state, r.district, r.market) for r in snapshot.records
        if state is None or r.state.casefold() == state.casefold()
    })
    if not identities:
        raise ValueError("Selected state has no verified reported markets")
    if path.exists():
        raise FileExistsError(f"Refusing to overwrite existing location work: {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        writer.writeheader()
        for st, district, market in identities:
            writer.writerow({
                "state": st, "district": district, "market": market,
                "latitude": "", "longitude": "", "verified": "false",
                "source_url": "",
            })
    return len(identities)


def main() -> None:
    parser = argparse.ArgumentParser(description="Export unverified sourcing checklist")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--state")
    args = parser.parse_args()
    print(f"Exported {generate_candidates(args.output, args.state)} markets; "
          "verify exact mandi points and record HTTPS sources before use.")


if __name__ == "__main__":
    main()
