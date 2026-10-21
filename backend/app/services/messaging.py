"""Message interface and explicit disabled external integrations.

No provider is contacted until opted-in recipient and approved template
requirements are implemented and verified. Used for digest preview only.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class DeliveryResult:
    status: str
    provider_message_id: str | None = None


class MockMessagingProvider:
    def send(self, recipient: str, content: str) -> DeliveryResult:
        if not recipient or not content:
            raise ValueError("Recipient and content required")
        return DeliveryResult(status="mock_only")


class DisabledExternalProvider:
    def send(self, recipient: str, content: str) -> DeliveryResult:
        raise RuntimeError(
            "External SMS/WhatsApp sending is disabled until consent and "
            "provider templates are configured"
        )
