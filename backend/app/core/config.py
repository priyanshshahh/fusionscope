import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "FusionScope"
    debug: bool = False
    database_url: str = "sqlite:///./fusionscope.db"
    
    # CORS
    allowed_origins: list = [
        "http://localhost:8080",
        "http://localhost:3000",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:3000",
    ]
    
    class Config:
        env_file = ".env"
        extra = "ignore"


# Load settings
settings = Settings()

# Override with environment variables if present
if os.getenv("DATABASE_URL"):
    settings.database_url = os.getenv("DATABASE_URL")
if os.getenv("DEBUG"):
    settings.debug = os.getenv("DEBUG", "False").lower() == "true"
