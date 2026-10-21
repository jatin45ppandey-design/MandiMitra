"""Local readiness reporting must not reveal credentials."""
from scripts.doctor import configured, diagnostic_lines


def test_placeholders_not_treated_as_valid_secrets() -> None:
    assert not configured("")
    assert not configured(None)
    assert not configured("REPLACE_WITH_KEY")
    assert not configured("YOUR_API_KEY")
    assert not configured("PASTE_TOKEN")
    assert configured("test-placeholder-for-unit-test")


def test_diagnostic_reports_status_not_secret_values() -> None:
    content = "\n".join(diagnostic_lines())
    assert "Government API key configured:" in content
    assert "Supabase backend URL + public key configured:" in content
    assert "PostgreSQL connection configured:" in content
    assert "Verified price records:" in content
    assert "Account alert storage:" in content
    assert "OPENROUTESERVICE_API_KEY=" not in content
    assert "DATA_GOV_API_KEY=" not in content
