from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class MarketPrice(BaseModel):
    state: str = Field(min_length=1)
    district: str = Field(min_length=1)
    market: str = Field(min_length=1)
    commodity: str = Field(min_length=1)
    variety: str | None = None
    arrival_date: date
    min_price: Decimal | None = Field(default=None, ge=0)
    max_price: Decimal | None = Field(default=None, ge=0)
    modal_price: Decimal | None = Field(default=None, ge=0)
    price_unit: Literal["INR/quintal"] = "INR/quintal"
    source: str = "AGMARKNET"
    fetched_at: datetime | None = None

    @model_validator(mode="after")
    def validate_price_order(self) -> "MarketPrice":
        if (
            self.min_price is not None
            and self.modal_price is not None
            and self.min_price > self.modal_price
        ):
            raise ValueError("Minimum price exceeds modal price")
        if (
            self.max_price is not None
            and self.modal_price is not None
            and self.modal_price > self.max_price
        ):
            raise ValueError("Modal price exceeds maximum price")
        if (
            self.min_price is not None
            and self.max_price is not None
            and self.min_price > self.max_price
        ):
            raise ValueError("Minimum price exceeds maximum price")
        return self


class SnapshotMetadata(BaseModel):
    source: str
    fetched_at: datetime | None = None
    latest_report_date: date | None = None
    record_count: int = Field(ge=0)
    verified: bool = False


class MandiSnapshot(BaseModel):
    metadata: SnapshotMetadata
    records: list[MarketPrice] = Field(default_factory=list)


class ListingResponse(BaseModel):
    items: list[str]


class PriceResponse(BaseModel):
    records: list[MarketPrice]
    count: int
    verified: bool
    latest_report_date: date | None = None


class TrendObservation(BaseModel):
    report_date: date
    modal_price: Decimal
    market: str
    variety: str | None = None


class TrendResponse(BaseModel):
    observations: list[TrendObservation]
    verified: bool
    message: str | None = None

