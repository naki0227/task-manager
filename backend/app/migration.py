
import logging
from sqlalchemy import text
from app.database import engine

logger = logging.getLogger(__name__)

def run_migrations():
    """Run database migrations manually when Alembic is not available"""
    logger.info("Checking database schema...")
    
    with engine.connect() as conn:
        try:
            # Check 'tasks' table for 'position' column
            # Compatible with both SQLite and PostgreSQL
            # Note: For SQLite, text query works. For Postgres, information_schema is better but text query on error also works.
            # Using simple SELECT to check column existence is safest cross-db way without inspecting metadata which might be cached.
            
            try:
                conn.execute(text("SELECT position FROM tasks LIMIT 1"))
                logger.info("Column 'position' already exists in 'tasks'.")
            except Exception:
                logger.info("Column 'position' missing in 'tasks'. Adding it...")
                # Add column
                # SQLite doesn't support IF NOT EXISTS for columns in older versions, so catching exception above handles it.
                # PostgreSQL supports it but we are in the exception block anyway.
                conn.execute(text("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0"))
                conn.commit()
                logger.info("Migration successful: Added 'position' to 'tasks'.")
                
            # Check 'tasks' table for 'deleted' column
            try:
                conn.execute(text("SELECT deleted FROM tasks LIMIT 1"))
                logger.info("Column 'deleted' already exists in 'tasks'.")
            except Exception:
                logger.info("Column 'deleted' missing in 'tasks'. Adding it...")
                conn.execute(text("ALTER TABLE tasks ADD COLUMN deleted BOOLEAN DEFAULT 0")) # 0 for False in SQLite/Postgres compatibility
                conn.commit()
                logger.info("Migration successful: Added 'deleted' to 'tasks'.")
                
        except Exception as e:
            logger.error(f"Migration failed or checked failed: {e}")
