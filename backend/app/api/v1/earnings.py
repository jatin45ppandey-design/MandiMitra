from fastapi import APIRouter

from app.services.earnings import TransportInput, TransportResult, calculate

router = APIRouter(prefix="/transport", tags=["transport"])


@router.post("/estimate", response_model=TransportResult)
def estimate(request: TransportInput) -> TransportResult:
    return calculate(request)
