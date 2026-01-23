
import os
import logging
from celery import Celery
import asyncio
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis URL from Env
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
SENTRY_DSN = os.getenv("SENTRY_DSN")

if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.celery import CeleryIntegration
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[CeleryIntegration()],
        traces_sample_rate=1.0,
    )

celery = Celery(
    "worker",
    broker=REDIS_URL,
    backend=REDIS_URL # Use Redis for results too
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True, # Safety: Only ack after success
)

@celery.task(bind=True, max_retries=3, default_retry_delay=60)
def send_slack_message_task(self, user_id: int, channel: str, text: str, proposal_id: int = None):
    """
    Celery task to send slack message.
    """
    from app.services.slack_service import SlackService
    from app.routers.slack import get_slack_token
    from app.database import SessionLocal
    from app.models import Proposal # Added
    
    logger.info(f"Task: Sending Slack Message to {channel} for User {user_id}")
    
    # helper for async in celery
    def run_async(coro):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
             return loop.run_until_complete(coro)
        finally:
             loop.close()

    db = SessionLocal()
    try:
        # Helper for message sending
        async def execute_send():
            token = await get_slack_token(user_id, db)
            await SlackService.post_message(token, channel, text)

        # Mock Mode Check
        from app.config import get_settings
        if get_settings().mock_external_apis:
             logger.info(f"MOCK MODE: Skipping actual Slack API call to {channel}")
             # Simulate success
             pass
        else:
             run_async(execute_send())
        
        # Update Proposal Status if ID provided
        if proposal_id:
            proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
            if proposal:
                proposal.status = "executed"
                db.commit()
        
        logger.info("Task: Slack Message Sent")
        return {"status": "sent"}
        
    except Exception as e:
        logger.error(f"Task Failed: {e}")
        # Failure update
        if proposal_id:
            try:
                proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
                if proposal:
                    proposal.status = "failed"
                    db.commit()
            except:
                pass
        raise self.retry(exc=e)
    finally:
        db.close()

@celery.task(bind=True, max_retries=3)
def log_action_task(self, user_id: int, action_type: str, details: Dict[str, Any], status: str = "success", error: str = None):
    """
    Async Logging Task.
    Replaces synchronous DB logging and EventBus.
    """
    from app.models import ActionLog
    from app.database import SessionLocal
    import json
    
    db = SessionLocal()
    try:
        log_entry = ActionLog(
            user_id=user_id,
            action_type=action_type,
            resource_type="async_task",
            details=json.dumps(details),
            risk_level="info" # Default for logs
        )
        db.add(log_entry)
        db.commit()
    except Exception as e:
        logger.error(f"Logging Failed: {e}")
    finally:
        db.close()

@celery.task(bind=True)
def test_task(self):
    logger.info("Test task executed")
    return "pong"
