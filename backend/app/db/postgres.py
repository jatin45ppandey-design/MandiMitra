"""Supabase is managed PostgreSQL. Use a server-side connection URL only."""
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine

from app.core.config import settings

_engine: Engine | None = None


def engine() -> Engine:
    global _engine
    if not settings.database_url or "REPLACE_" in settings.database_url:
        raise RuntimeError("DATABASE_URL must be set to a real PostgreSQL URL")
    if not settings.database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        raise RuntimeError("DATABASE_URL must be PostgreSQL")
    if _engine is None:
        _engine = create_engine(
            settings.database_url, pool_pre_ping=True, pool_size=3, max_overflow=2,
        )
    return _engine
