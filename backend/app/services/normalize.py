"""Normalize government rows without guessing missing dates, prices or varieties."""

from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any
from zoneinfo import ZoneInfo

from pydantic import ValidationError

from app.schemas.prices import MarketPrice


def _text(value: object) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().split())


def _optional_text(value: object) -> str | None:
    return _text(value) or None


def _date(value: object) -> date:
    if isinstance(value, date) and not isinstance(value, datetime):
        if value > datetime.now(ZoneInfo("Asia/Kolkata")).date():
            raise ValueError("Reporting date cannot be in the future")
        return value
    raw = _text(value)
    for format_string in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            result = datetime.strptime(raw, format_string).date()
            if result > datetime.now(ZoneInfo("Asia/Kolkata")).date():
                raise ValueError("Reporting date cannot be in the future")
            return result
        except ValueError:
            continue
    raise ValueError("Unrecognized or future reporting date")


def _price(value: object) -> Decimal | None:
    raw = _text(value).replace(",", "")
    if not raw or raw.upper() in {"NA", "N/A", "-", "NULL", "NONE"}:
        return None
    try:
        result = Decimal(raw)
        if not result.is_finite() or result <= 0:
            return None
        return result
    except (InvalidOperation, ValueError):
        return None


def normalize_record(
    raw: dict[str, Any],
    *,
    fetched_at: datetime,
) -> MarketPrice:
    """Reject unusable rows instead of inventing a modal rate or reporting date."""
    fields = {
        str(key).strip().lower().replace(" ", "_"): value
        for key, value in raw.items()
    }
    modal_price = _price(fields.get("modal_price"))
    if modal_price is None:
        raise ValueError("Missing or invalid modal price")

    record = {
        "state": _text(fields.get("state")),
        "district": _text(fields.get("district")),
        "market": _text(fields.get("market")),
        "commodity": _text(fields.get("commodity")),
        "variety": _optional_text(fields.get("variety")),
        "grade": _optional_text(fields.get("grade")),
        "arrival_date": _date(fields.get("arrival_date")),
        "min_price": _price(fields.get("min_price")),
        "max_price": _price(fields.get("max_price")),
        "modal_price": modal_price,
        "price_unit": "INR/quintal",
        "source": "data.gov.in / AGMARKNET",
        "fetched_at": fetched_at,
    }
    try:
        return MarketPrice.model_validate(record)
    except ValidationError as exc:
        raise ValueError("Government row failed schema checks") from exc


def normalize_records(
    records: list[dict[str, Any]],
    *,
    fetched_at: datetime,
) -> tuple[list[MarketPrice], int]:
    accepted: dict[tuple[str, ...], MarketPrice] = {}
    rejected = 0
    for raw in records:
        try:
            record = normalize_record(raw, fetched_at=fetched_at)
        except ValueError:
            rejected += 1
            continue
        identity = (
            record.state.casefold(),
            record.district.casefold(),
            record.market.casefold(),
            record.commodity.casefold(),
            (record.variety or "").casefold(),
            (record.grade or "").casefold(),
            record.arrival_date.isoformat(),
        )
        accepted[identity] = record
    return (
        sorted(
            accepted.values(),
            key=lambda item: (
                item.state,
                item.district,
                item.commodity,
                item.market,
                item.arrival_date,
            ),
        ),
        rejected,
    )

