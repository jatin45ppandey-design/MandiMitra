"""Prefer accumulated verified history; safely fall back to the bundled snapshot."""

from app.repositories.history import HistoryRepository
from app.repositories.snapshot import SnapshotRepository
from app.schemas.prices import MandiSnapshot


def read_prices() -> MandiSnapshot:
    history = HistoryRepository().read()
    if history.metadata.verified and history.records:
        return history
    return SnapshotRepository().read()
