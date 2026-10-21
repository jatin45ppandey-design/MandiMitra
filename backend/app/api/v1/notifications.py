from fastapi import APIRouter, Depends
from sqlalchemy import text

from app.core.auth import current_user_id
from app.db.postgres import engine

router = APIRouter(tags=["notifications"])


@router.get("/notifications")
def notifications(owner: str = Depends(current_user_id)) -> dict:
    with engine().connect() as db:
        rows = db.execute(text("""
            SELECT n.id,n.observation_identity,n.channel,n.status,n.created_at
            FROM notification_events n
            JOIN price_alerts a ON a.id=n.alert_id
            WHERE a.user_id=CAST(:owner AS uuid)
            ORDER BY n.created_at DESC LIMIT 100
        """), {"owner": owner}).mappings()
        events = [dict(row) for row in rows]
    return {"items": events}
