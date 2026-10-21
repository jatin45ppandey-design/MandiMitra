"""Idempotent threshold-crossing worker for newly reported verified observations."""
import json
from datetime import timezone
from uuid import uuid4

from sqlalchemy import text

from app.db.postgres import engine
from app.schemas.prices import MarketPrice
from app.services.alert_engine import crosses


def process() -> int:
    count = 0
    with engine().begin() as db:
        alerts = [dict(r) for r in db.execute(text(
            "SELECT * FROM price_alerts WHERE enabled=TRUE AND channel='in_app'"
        )).mappings()]
        observations = db.execute(text(
            "SELECT identity, record, imported_at, report_date FROM mandi_observations "
            "ORDER BY report_date ASC, imported_at ASC"
        )).mappings().all()
        history = []
        for item in observations:
            value = item["record"]
            record = MarketPrice.model_validate(
                json.loads(value) if isinstance(value, str) else value
            )
            history.append((item, record))
        for alert in alerts:
            previous: MarketPrice | None = None
            for item, record in history:
                same = all(
                    str(alert[field] or "").casefold() == str(getattr(record, field) or "").casefold()
                    for field in ("state", "district", "market", "commodity", "variety", "grade")
                )
                if not same:
                    continue
                # Imported history before an alert can establish a baseline without notifying.
                date_created = alert["created_at"].astimezone(timezone.utc).date()
                newly_reported = (item["imported_at"] >= alert["created_at"]
                                  and record.arrival_date >= date_created)
                if newly_reported and crosses(alert, previous, record):
                    result = db.execute(text("""
                        INSERT INTO notification_events
                            (id,alert_id,observation_identity,channel,status)
                        VALUES (CAST(:id AS uuid),CAST(:alert AS uuid),
                                :observation,'in_app','ready')
                        ON CONFLICT (alert_id,observation_identity,channel) DO NOTHING
                    """), {"id": str(uuid4()), "alert": str(alert["id"]),
                           "observation": item["identity"]})
                    count += result.rowcount
                previous = record
    return count


if __name__ == "__main__":
    print(f"Created {process()} newly crossed price alerts")
