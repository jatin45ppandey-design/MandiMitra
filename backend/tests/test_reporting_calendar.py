"""Report dates use the market's local day and cannot be fabricated in the future."""
from datetime import date, timedelta
from zoneinfo import ZoneInfo
from datetime import datetime

import pytest

from app.services.normalize import _date


def test_future_typed_date_is_rejected():
    tomorrow = datetime.now(ZoneInfo("Asia/Kolkata")).date() + timedelta(days=1)
    with pytest.raises(ValueError, match="future"):
        _date(tomorrow)


def test_today_uses_indian_reporting_calendar():
    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    assert _date(today) == today
    assert _date(today.strftime("%d/%m/%Y")) == today


def test_legacy_past_dates_remain_valid():
    assert _date(date(2020, 10, 21)) == date(2020, 10, 21)
