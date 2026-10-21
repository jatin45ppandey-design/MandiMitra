from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

class AlertCreate(BaseModel):
    state: str = Field(min_length=1, max_length=120)
    district: str = Field(min_length=1, max_length=120)
    market: str = Field(min_length=1, max_length=120)
    commodity: str = Field(min_length=1, max_length=120)
    variety: str = Field(min_length=1, max_length=120)
    grade: str = Field(min_length=1, max_length=120)
    threshold: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    direction: Literal["above", "below"]
    channel: Literal["in_app", "sms", "whatsapp"] = "in_app"

class AlertView(AlertCreate):
    id: UUID
    enabled: bool

class PreferenceUpdate(BaseModel):
    language: Literal["hi", "en"] = "hi"
    default_state: str | None = None
    default_district: str | None = None
    default_commodity: str | None = None
