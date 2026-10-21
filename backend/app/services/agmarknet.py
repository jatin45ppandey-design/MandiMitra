from app.core.config import settings


class AgmarknetClient:
    """Phase 1 integration seam. No outbound request or test data in Phase 0."""

    def __init__(self) -> None:
        self.base_url = settings.data_gov_base_url
        self.resource_id = settings.agmarknet_resource_id

    async def fetch_prices(self) -> None:
        raise NotImplementedError(
            "Phase 1: fetch through backend, normalize, verify and publish snapshot"
        )

