
from sqlalchemy.orm import Session
from app.models import AIActivity

def log_ai_activity(db: Session, user_id: int, activity_type: str, message: str):
    """
    Log an AI activity to the database.
    type: "folder" | "file" | "summary" | "analysis"
    """
    try:
        activity = AIActivity(
            user_id=user_id,
            type=activity_type,
            message=message
        )
        db.add(activity)
        db.commit()
    except Exception as e:
        print(f"Failed to log activity: {e}")
        db.rollback()
