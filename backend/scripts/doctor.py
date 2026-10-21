"""Check MandiMitra local setup without printing or contacting credentials.

Run FROM backend/ with: python -m scripts.doctor
This diagnostic only reads local files/config; it never calls external APIs.
"""
from pathlib import Path

from app.core.config import settings
from app.repositories.prices import read_prices
from app.services.nearby import read_verified_coordinates

BACKEND_ROOT = Path(__file__).resolve().parents[1]
FRONTEND_ROOT = BACKEND_ROOT.parent / "frontend"


def configured(value: str | None) -> bool:
    """Do not treat example placeholders as valid credentials."""
    if not value:
        return False
    stripped = value.strip()
    return bool(stripped and not stripped.startswith(
        ("REPLACE_", "YOUR_", "PASTE_", "postgresql://username:password")
    ))


def diagnostic_lines() -> list[str]:
    """Produce only human-readable statuses; never include env secrets."""
    backend_env = BACKEND_ROOT / ".env"
    frontend_env = FRONTEND_ROOT / ".env.local"
    database_ready = configured(settings.database_url)
    supabase_ready = configured(settings.supabase_url) and configured(
        settings.supabase_client_key
    )
    status = [
        "MandiMitra local readiness (credentials hidden)",
        f"Working directory is backend/: {'YES' if Path.cwd().resolve() == BACKEND_ROOT else 'NO'}",
        f"backend/.env exists: {'YES' if backend_env.is_file() else 'NO'}",
        f"frontend/.env.local exists: {'YES' if frontend_env.is_file() else 'NO'}",
        f"Government API key configured: {'YES' if configured(settings.data_gov_api_key) else 'NO'}",
        f"OpenRouteService key configured: {'YES' if configured(settings.openrouteservice_api_key) else 'NO'}",
        f"Supabase backend URL + public key configured: {'YES' if supabase_ready else 'NO'}",
        f"PostgreSQL connection configured: {'YES' if database_ready else 'NO'}",
        f"Public price storage mode: {settings.database_backend}",
    ]
    try:
        if settings.database_backend == "postgres" and not database_ready:
            raise RuntimeError("Database connection not configured")
        snapshot = read_prices()
        status.extend([
            f"Verified price records: {len(snapshot.records) if snapshot.metadata.verified else 0}",
            f"Latest reported price date: {snapshot.metadata.latest_report_date or 'NONE'}",
        ])
    except Exception:
        status.append("Verified price records: UNAVAILABLE (check storage and migration)")
    try:
        coords = read_verified_coordinates()
        status.append(f"Verified mandi coordinates: {len(coords)}")
    except Exception:
        status.append("Verified mandi coordinates: UNAVAILABLE")

    status.append(
        "Account alert storage: "
        + ("CONFIGURED (connectivity and schema still require testing)"
           if supabase_ready and database_ready
           else "NOT READY (backend Supabase URL/key + DATABASE_URL needed)")
    )
    if not configured(settings.data_gov_api_key):
        status.append("NEXT: Add DATA_GOV_API_KEY in backend/.env (not frontend/.env.local).")
    else:
        status.append(
            "NEXT: Run python -m scripts.sync_mandi_catalog --page-size 100 --max-pages 2 --dry-run"
        )
    if not supabase_ready:
        status.append(
            "NEXT: Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in backend/.env; "
            "restart Uvicorn."
        )
    if not database_ready:
        status.append(
            "NEXT: For cloud alerts, configure DATABASE_URL and apply "
            "backend/app/db/schema.sql before accessing protected APIs."
        )
    return status


def main() -> None:
    for line in diagnostic_lines():
        print(line)


if __name__ == "__main__":
    main()
