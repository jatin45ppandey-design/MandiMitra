"""Explicit migrations. Never automatically modify a hosted DB on API startup."""
from pathlib import Path
from sqlalchemy import text
from app.db.postgres import engine


def main() -> None:
    schema = (Path(__file__).resolve().parents[1] / "app" / "db" / "schema.sql").read_text()
    # Migration is separated by statements (no SQL semicolons in literals).
    with engine().begin() as connection:
        for statement in schema.split(";"):
            if statement.strip():
                connection.execute(text(statement))
    print("PostgreSQL schema initialized; verify tables/permissions in Supabase.")


if __name__ == "__main__":
    main()
