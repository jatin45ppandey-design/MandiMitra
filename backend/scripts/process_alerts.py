"""Cron worker; creates idempotent in-app events for new verified observations."""
import json
from uuid import uuid4

from sqlalchemy import text
from app.db.postgres import engine
from app.schemas.prices import MarketPrice
from app.services.alert_engine import matches


def process() -> int:
    count = 0
    with engine().begin() as db:
        alerts = [dict(r) for r in db.execute(text(
            "SELECT * FROM price_alerts WHERE enabled=TRUE AND channel='in_app'"
        )).mappings()]
        observations = db.execute(text(
            "SELECT identity,record FROM mandi_observations"
        )).mappings().all()
        for item in observations:
            payload = item["record"]
            record = MarketPrice.model_validate(
                json.loads(payload) if isinstance(payload, str) else payload
            )
            for alert in alerts:
                if not matches(alert, record):
                    continue
                result = db.execute(text("""
                    INSERT INTO notification_events
                        (id,alert_id,observation_identity,channel,status)
                    VALUES (CAST(:id AS uuid),CAST(:alert AS uuid),
                            :observation,'in_app','ready')
                    ON CONFLICT (alert_id,observation_identity,channel) DO NOTHING
                """), {
                    "id": str(uuid4()), "alert": str(alert["id"]),
                    "observation": item["identity"],
                })
                count += result.rowcount
    return count


if __name__ == "__main__":
    print(f"Created {process()} new in-app notification events")
