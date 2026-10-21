"""Pure helpers for verified market observations."""

from app.schemas.prices import MandiSnapshot, MarketPrice, PriceResponse


def filter_prices(
    snapshot: MandiSnapshot,
    *,
    commodity: str | None = None,
    state: str | None = None,
    district: str | None = None,
    market: str | None = None,
    variety: str | None = None,
) -> list[MarketPrice]:
    filters = {
        "commodity": commodity,
        "state": state,
        "district": district,
        "market": market,
        "variety": variety,
    }
    records = snapshot.records
    for field, expected in filters.items():
        if expected is not None:
            records = [
                record
                for record in records
                if str(getattr(record, field) or "").casefold() == expected.casefold()
            ]
    return sorted(records, key=lambda record: record.arrival_date, reverse=True)


def latest_per_market_and_variety(records: list[MarketPrice]) -> list[MarketPrice]:
    """One latest observation per market/commodity/variety/grade.

    Keep different varieties and grades separate instead of pretending they are
    directly comparable. Deterministically prefer the newest report in each group.
    """
    latest: dict[tuple[str, ...], MarketPrice] = {}
    for record in sorted(records, key=lambda item: item.arrival_date, reverse=True):
        identity = (
            record.state.casefold(),
            record.district.casefold(),
            record.market.casefold(),
            record.commodity.casefold(),
            (record.variety or "").casefold(),
            (record.grade or "").casefold(),
        )
        latest.setdefault(identity, record)
    return sorted(
        latest.values(),
        key=lambda record: (record.market.casefold(), (record.variety or "").casefold()),
    )


def build_price_response(snapshot: MandiSnapshot, records: list[MarketPrice]) -> PriceResponse:
    return PriceResponse(
        records=records,
        count=len(records),
        verified=snapshot.metadata.verified,
        latest_report_date=max((r.arrival_date for r in records), default=None),
    )
