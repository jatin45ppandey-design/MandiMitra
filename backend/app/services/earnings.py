from decimal import Decimal
from pydantic import BaseModel, Field, model_validator
from app.services.transport import estimated_net_proceeds


class TransportInput(BaseModel):
    rate_per_quintal: Decimal = Field(gt=0)
    quantity_quintals: Decimal = Field(gt=0)
    transport_cost: Decimal = Field(ge=0)
    loading_cost: Decimal = Field(default=Decimal(0), ge=0)
    market_fees: Decimal = Field(default=Decimal(0), ge=0)
    other_costs: Decimal = Field(default=Decimal(0), ge=0)


class TransportResult(BaseModel):
    gross_estimate: Decimal
    total_costs: Decimal
    net_estimate: Decimal
    disclaimer: str = "Estimate only: reported modal rates are not guaranteed selling prices."


def calculate(request: TransportInput) -> TransportResult:
    expenses = (
        request.transport_cost + request.loading_cost
        + request.market_fees + request.other_costs
    )
    return TransportResult(
        gross_estimate=request.rate_per_quintal * request.quantity_quintals,
        total_costs=expenses,
        net_estimate=estimated_net_proceeds(
            request.rate_per_quintal, request.quantity_quintals, expenses
        ),
    )
