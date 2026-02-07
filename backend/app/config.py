from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Kargo CTRM"
    DATABASE_URL: str = "sqlite:///./kargo.db"
    DEBUG: bool = True

    model_config = {"env_prefix": "KARGO_"}


settings = Settings()
