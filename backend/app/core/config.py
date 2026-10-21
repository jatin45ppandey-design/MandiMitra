from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173"
    data_gov_base_url: str = "https://api.data.gov.in"
    agmarknet_resource_id: str = "9ef84268-d588-465a-a308-a864a43d0070"
    data_gov_api_key: str | None = None
    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_publishable_key: str = ""

    @property
    def supabase_client_key(self) -> str:
        return self.supabase_publishable_key or self.supabase_anon_key
    database_backend: str = "snapshot"
    api_prefix: str = "/api/v1"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
