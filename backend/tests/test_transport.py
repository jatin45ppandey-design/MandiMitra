from decimal import Decimal

import pytest

from app.services.transport import estimated_net_proceeds


def test_transport_adjusted_proceeds() -> None:
    assert estimated_net_proceeds(
        Decimal(2300), Decimal(10), Decimal(3000)
    ) == Decimal(20000)


def test_no_negative_cost() -> None:
    with pytest.raises(ValueError):
        estimated_net_proceeds(
            Decimal(2300), Decimal(10), Decimal(-1)
        )
