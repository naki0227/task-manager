
import logging
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json

from app.models import ActionLog, User
from app.core.redis import redis_client

logger = logging.getLogger(__name__)

MAX_ACTIONS_PER_HOUR = 50

class SafetyService:
    def __init__(self, db: Session):
        self.db = db

    async def check_rate_limit(self, user_id: int) -> bool:
        """
        Check if user exceeded action rate limit (Token Bucket via Redis).
        """
        try:
            client = redis_client.get_client()
            key = f"rate_limit:{user_id}"
            
            # Simple fixed window counter for now (expires in 1 hour)
            # Increment
            current_count = await client.incr(key)
            
            if current_count == 1:
                # Set expiry on first incr
                await client.expire(key, 3600)
            
            if current_count > MAX_ACTIONS_PER_HOUR:
                logger.warning(f"Rate limit exceeded for user {user_id}: {current_count}/{MAX_ACTIONS_PER_HOUR}")
                return False
                
            return True
            
        except Exception as e:
            logger.error(f"Redis rate limit check failed: {e}")
            # Fail open or closed? Fail open for now to avoid blocking if redis fails
            return True

    def log_action(self, user_id: int, action_type: str, resource_type: str, details: dict = None, risk_level: str = "low"):
        """
        Log an AI action for audit trail.
        """
        try:
            log = ActionLog(
                user_id=user_id,
                action_type=action_type,
                resource_type=resource_type,
                details=json.dumps(details or {}),
                risk_level=risk_level,
                timestamp=datetime.utcnow()
            )
            self.db.add(log)
            # self.db.commit() # Caller should commit
            logger.info(f"Action Logged: {action_type} - {resource_type}")
        except Exception as e:
            logger.error(f"Failed to log action: {e}")
