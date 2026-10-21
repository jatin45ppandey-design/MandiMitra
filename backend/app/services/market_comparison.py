"""No coordinates or road routes are inferred from district or market names."""

from datetime import date

from app.schemas.prices import MarketPrice
from app.services.price_service import latest_per_market_and_variety


def compare_same_district(
    records: list[MarketPrice], *, variety: str | None, grade: str | None
) -> list[MarketPrice]:
    """Compare latest reports, only if known variety AND grade are specified.

    Strict matching prevents apples-to-oranges comparisons. Unknown/missing
    variety or grade is not silently treated as equivalent.
    """
    if not variety or not grade:
        return []
    relevant = [
        item for item in records
        if (item.variety or "").casefold() == variety.casefold()
        and (item.grade or "").casefold() == grade.casefold()
    ]
    return latest_per_market_and_variety(relevant)


def freshness_days(record: MarketPrice, *, as_of: date) -> int:
    return (as_of - record.arrival_date).days
