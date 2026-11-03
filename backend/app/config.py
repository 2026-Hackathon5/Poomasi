from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""
    kakao_rest_api_key: str = ""
    ai_api_key: str = ""
    cors_origins: str = "http://localhost:5173"

    @field_validator("database_url")
    @classmethod
    def use_psycopg_driver(cls, v: str) -> str:
        # Supabase가 주는 postgresql:// 주소를 그대로 붙여 넣어도 psycopg 3을 쓰게 한다
        for prefix in ("postgresql://", "postgres://"):
            if v.startswith(prefix):
                return "postgresql+psycopg://" + v[len(prefix):]
        return v

    @field_validator("supabase_url")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        # 대시보드의 API URL(.../rest/v1)을 붙여 넣어도 프로젝트 주소만 남긴다
        return v.rstrip("/").removesuffix("/rest/v1")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
