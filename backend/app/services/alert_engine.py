"""Pure alert matching. Trigger once per actual observation via DB uniqueness."""
from decimal import Decimal

from app.schemas.prices import MarketPrice


def matches(alert: dict, record: MarketPrice) -> bool:
    keys = ("state", "district", "market", "commodity", "variety", "grade")
    if any(
        (str(alert[k]) or "").casefold()
        != (str(getattr(record, k) or "")).casefold()
        for k in keys
    ):
        return False
    if record.modal_price is None:
        return False
    threshold = Decimal(str(alert["threshold"]))
    if alert["direction"] == "above":
        return record.modal_price >= threshold
    if alert["direction"] == "below":
        return record.modal_price <= threshold
    return False


def hindi_digest(record: MarketPrice) -> str:
    return (
        f"मंडी भाव: {record.commodity} ({record.variety or 'किस्म अज्ञात'}), "
        f"{record.market}, {record.district}: ₹{record.modal_price}/क्विंटल। "
        f"रिपोर्ट: {record.arrival_date.isoformat()}। "
        "स्रोत: AGMARKNET/data.gov.in। वास्तविक बिक्री भाव अलग हो सकता है।"
    )


def crosses(alert: dict, previous: MarketPrice | None, current: MarketPrice) -> bool:
    """New threshold crossing, not another day remaining above/below the target."""
    if previous is None or previous.modal_price is None or current.modal_price is None:
        return False
    keys = ("state", "district", "market", "commodity", "variety", "grade")
    if any(
        (str(getattr(previous, key) or "")).casefold()
        != (str(getattr(current, key) or "")).casefold()
        for key in keys
    ):
        return False
    if not matches(alert, current):
        return False
    threshold = Decimal(str(alert["threshold"]))
    if alert["direction"] == "above":
        return previous.modal_price < threshold <= current.modal_price
    if alert["direction"] == "below":
        return previous.modal_price > threshold >= current.modal_price
    return False
