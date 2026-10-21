from decimal import Decimal


def estimated_net_proceeds(
    modal_price_per_quintal: Decimal,
    quantity_quintals: Decimal,
    transport_cost: Decimal,
    other_costs: Decimal = Decimal(0),
) -> Decimal:
    """Illustrative net amount; not a sale-price guarantee."""
    if any(value < 0 for value in (
        modal_price_per_quintal, quantity_quintals, transport_cost, other_costs
    )):
        raise ValueError("Costs, quantity and price must be non-negative")
    return modal_price_per_quintal * quantity_quintals - transport_cost - other_costs
