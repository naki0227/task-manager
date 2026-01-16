"""
Database Connection
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models import Base

settings = get_settings()

# Create engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False}  # SQLite only
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
