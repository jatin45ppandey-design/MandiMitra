"""Read Supabase PostgreSQL in hosted mode; snapshots for offline development."""
from app.core.config import settings
from app.repositories.history import HistoryRepository
from app.repositories.snapshot import SnapshotRepository
from app.schemas.prices import MandiSnapshot


def read_prices() -> MandiSnapshot:
    if settings.database_backend == "postgres":
        from app.repositories.postgres_prices import load_verified
        return load_verified()
    if settings.database_backend != "snapshot":
        raise RuntimeError("DATABASE_BACKEND must be snapshot or postgres")
    history = HistoryRepository().read()
    if history.metadata.verified and history.records:
        return history
    return SnapshotRepository().read()
