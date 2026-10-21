import json
from pathlib import Path

from app.schemas.prices import MandiSnapshot

SNAPSHOT_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "snapshots" / "mandi-snapshot.json"
)


class SnapshotRepository:
    """Read versioned verified data. Never silently invent records."""

    def __init__(self, path: Path = SNAPSHOT_PATH):
        self.path = path

    def read(self) -> MandiSnapshot:
        data = json.loads(self.path.read_text(encoding="utf-8"))
        snapshot = MandiSnapshot.model_validate(data)
        if not snapshot.metadata.verified:
            # Prevent unfinished or unverified imports appearing as official prices.
            return MandiSnapshot(metadata=snapshot.metadata, records=[])
        return snapshot

