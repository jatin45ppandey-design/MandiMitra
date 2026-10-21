"""Server-side owner-filtered alert and preference persistence."""
from uuid import uuid4
from sqlalchemy import text
from app.db.postgres import engine
from app.schemas.alerts import AlertCreate, PreferenceUpdate


def create_alert(owner: str, alert: AlertCreate) -> dict:
    alert_id = str(uuid4())
    with engine().begin() as db:
        row = db.execute(text("""
            INSERT INTO price_alerts (
                id,user_id,state,district,market,commodity,variety,grade,
                direction,threshold,channel)
            VALUES (
                CAST(:id AS uuid),CAST(:owner AS uuid),:state,:district,:market,
                :commodity,:variety,:grade,:direction,:threshold,:channel)
            RETURNING id,state,district,market,commodity,variety,grade,
                      direction,threshold,channel,enabled
        """), {"id": alert_id, "owner": owner, **alert.model_dump()}).mappings().one()
    return dict(row)


def list_alerts(owner: str) -> list[dict]:
    with engine().connect() as db:
        rows = db.execute(text("""
            SELECT id,state,district,market,commodity,variety,grade,
                   direction,threshold,channel,enabled
            FROM price_alerts WHERE user_id=CAST(:owner AS uuid)
            ORDER BY created_at DESC
        """), {"owner": owner}).mappings().all()
    return [dict(row) for row in rows]


def disable_alert(owner: str, alert_id: str) -> bool:
    with engine().begin() as db:
        result = db.execute(text("""
            UPDATE price_alerts SET enabled=FALSE
            WHERE user_id=CAST(:owner AS uuid) AND id=CAST(:id AS uuid)
        """), {"owner": owner, "id": alert_id})
    return result.rowcount > 0


def save_preferences(owner: str, preferences: PreferenceUpdate) -> dict:
    params = {"owner": owner, **preferences.model_dump()}
    with engine().begin() as db:
        row = db.execute(text("""
            INSERT INTO farmer_preferences
            (user_id,language,default_state,default_district,default_commodity)
            VALUES (CAST(:owner AS uuid),:language,:default_state,
                    :default_district,:default_commodity)
            ON CONFLICT (user_id) DO UPDATE SET
                language=excluded.language,
                default_state=excluded.default_state,
                default_district=excluded.default_district,
                default_commodity=excluded.default_commodity,
                updated_at=now()
            RETURNING language,default_state,default_district,default_commodity
        """), params).mappings().one()
    return dict(row)


def get_preferences(owner: str) -> dict | None:
    """Return only the authenticated owner's saved cloud preferences."""
    with engine().connect() as db:
        row = db.execute(text("""
            SELECT language,default_state,default_district,default_commodity
            FROM farmer_preferences WHERE user_id=CAST(:owner AS uuid)
        """), {"owner": owner}).mappings().one_or_none()
    return dict(row) if row is not None else None
