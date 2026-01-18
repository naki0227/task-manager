
import sqlite3
import os

DB_PATH = "vision.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(tasks)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "position" not in columns:
            print("Adding position column...")
            cursor.execute("ALTER TABLE tasks ADD COLUMN position INTEGER DEFAULT 0")
            conn.commit()
            print("Migration successful: added position column.")
        else:
            print("Migration skipped: position column already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
