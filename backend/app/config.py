from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # App
    debug: bool = True
    frontend_url: str = "http://localhost:3000"
    
    # Gemini
    gemini_api_key: str = ""
    
    # GitHub OAuth
    github_client_id: str = ""
    github_client_secret: str = ""
    
    # Google OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    
    # Slack OAuth
    slack_client_id: str = ""
    slack_client_secret: str = ""
    
    # Notion OAuth
    notion_client_id: str = ""
    notion_client_secret: str = ""
    
    # Linear OAuth
    linear_client_id: str = ""
    linear_client_secret: str = ""
    
    # Todoist OAuth
    todoist_client_id: str = ""
    todoist_client_secret: str = ""
    
    # Discord OAuth
    discord_client_id: str = ""
    discord_client_secret: str = ""
    
    # Database
    database_url: str = "sqlite:///./vision.db"
    
    # Server
    port: int = 8000
    debug: bool = True

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"  # Ignore unknown env vars


@lru_cache()
def get_settings() -> Settings:
    return Settings()
