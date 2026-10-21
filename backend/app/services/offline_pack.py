"""Build a bounded offline set without dropping every historical observation.

Round-robin selection across distinct market/crop/variety/grade series retains
real reported dates and improves coverage compared with a global newest-N sort.
"""
from collections import defaultdict

from app.schemas.prices import MarketPrice


def balanced_offline_records(
    records: list[MarketPrice],
    *,
    limit: int,
    state: str | None = None,
) -> list[MarketPrice]:
    if not 1 <= limit <= 5000:
        raise ValueError("Offline limit must be between 1 and 5000")
    eligible = [
        item for item in records
        if state is None or item.state.casefold() == state.strip().casefold()
    ]
    if not eligible:
        raise ValueError("No verified matching observations for offline export")
    series: dict[tuple[str, ...], list[MarketPrice]] = defaultdict(list)
    for r in eligible:
        identity = (
            r.state.casefold(), r.district.casefold(), r.commodity.casefold(),
            r.market.casefold(), (r.variety or "").casefold(),
            (r.grade or "").casefold(),
        )
        series[identity].append(r)
    for rows in series.values():
        rows.sort(key=lambda r: r.arrival_date, reverse=True)

    # If there are more series than the budget, prioritize ones with newer reports.
    order = sorted(series, key=lambda key: (
        -series[key][0].arrival_date.toordinal(), key,
    ))
    selected = []
    depth = 0
    while len(selected) < limit:
        added = False
        for key in order:
            if len(series[key]) <= depth:
                continue
            selected.append(series[key][depth])
            added = True
            if len(selected) == limit:
                break
        if not added:
            break
        depth += 1
    return sorted(selected, key=lambda r: (
        -r.arrival_date.toordinal(), r.state.casefold(), r.district.casefold(),
        r.commodity.casefold(), r.market.casefold(),
    ))
