"""
Database Connection
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import get_settings
from app.models import Base

settings = get_settings()

database_url = settings.database_url
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

# Create engine
# If using Postgres, we might need pool_pre_ping=True
connect_args = {}
if "sqlite" in database_url:
    connect_args = {"check_same_thread": False}

engine = create_engine(
    database_url,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Create all tables"""
    # For Postgres, we might need to enable vector extension explicitly if not using docker image that has it pre-enabled
    # But image pgvector/pgvector:pg16 should have it.
    # However, we need to create the extension in the DB.
    try:
        with engine.connect() as conn:
            conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
            conn.commit()
    except Exception as e:
        print(f"Failed to create vector extension (might be strictly permissioned): {e}")
        
    # Deprecated in v1.3: Use Alembic Migrations
    # Base.metadata.create_all(bind=engine)
    pass


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
