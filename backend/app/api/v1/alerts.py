from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import current_user_id
from app.repositories import alerts as repository
from app.schemas.alerts import AlertCreate, AlertView, PreferenceUpdate

router = APIRouter(tags=["account"])


@router.post("/alerts", response_model=AlertView, status_code=201)
def create_alert(
    request: AlertCreate, owner: str = Depends(current_user_id),
) -> AlertView:
    # Real SMS/WhatsApp delivery requires a separately activated provider and
    # proof of channel-specific consent; do not silently enroll here.
    if request.channel != "in_app":
        raise HTTPException(
            status_code=422,
            detail="SMS/WhatsApp subscriptions need verified opt-in; use in_app for now",
        )
    return AlertView.model_validate(repository.create_alert(owner, request))


@router.get("/alerts", response_model=list[AlertView])
def alerts(owner: str = Depends(current_user_id)) -> list[AlertView]:
    return [AlertView.model_validate(x) for x in repository.list_alerts(owner)]


@router.delete("/alerts/{alert_id}", status_code=204)
def delete_alert(
    alert_id: UUID, owner: str = Depends(current_user_id),
) -> None:
    if not repository.disable_alert(owner, str(alert_id)):
        raise HTTPException(status_code=404, detail="Alert not found")


@router.put("/preferences", response_model=PreferenceUpdate)
def preferences(
    request: PreferenceUpdate, owner: str = Depends(current_user_id),
) -> PreferenceUpdate:
    return PreferenceUpdate.model_validate(repository.save_preferences(owner, request))


@router.get("/preferences", response_model=PreferenceUpdate | None)
def get_preferences(owner: str = Depends(current_user_id)) -> PreferenceUpdate | None:
    saved = repository.get_preferences(owner)
    return PreferenceUpdate.model_validate(saved) if saved else None
