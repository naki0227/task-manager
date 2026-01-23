
import logging
import json
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models import Proposal, User, Task
from app.routers.google import get_google_token
from app.routers.slack import get_slack_token
from app.services.slack_service import SlackService
from app.routers.gmail import create_gmail_draft, EmailDraft

logger = logging.getLogger(__name__)

from app.events import event_bus, EVENT_ACTION_SUCCESS, EVENT_ACTION_FAILED

class ActionService:
    @staticmethod
    async def execute_proposal(proposal: Proposal, user: User, db: Session):
        """
        Execute the approved proposal based on its type.
        """
        logger.info(f"Executing proposal {proposal.id} (Type: {proposal.type}) for user {user.id}")
        
        try:
            if proposal.type == "create_task":
                data = json.loads(proposal.payload)
                new_task = Task(
                    user_id=user.id,
                    title=data.get("title", proposal.title),
                    description=data.get("description", ""),
                    status="ready",
                    source="autonomous_agent",
                    estimated_time=data.get("estimated_time", "30m"),
                    prepared_items=data.get("prepared_items", "[]")
                )
                db.add(new_task)
                
            elif proposal.type == "email_reply":
                data = json.loads(proposal.payload)
                token = await get_google_token(user.id, db)
                
                draft = EmailDraft(
                    to=data.get("to"),
                    subject=data.get("subject"),
                    body=data.get("body")
                )
                await create_gmail_draft(token, draft)
                
            elif proposal.type == "slack_message":
                data = json.loads(proposal.payload)
                # token = await get_slack_token(user.id, db) # REMOVED: Worker fetches it securely
                
                # Hybrid Mode: Async via Celery
                from app.worker import send_slack_message_task
                
                # Secure Mode: Pass user_id (v1.2) + proposal_id (Sync)
                send_slack_message_task.delay(user.id, data.get("channel_id"), data.get("text"), proposal.id)
            
            else:
                logger.warning(f"Unknown proposal type: {proposal.type}")
            
            # Unified Async: Log via Celery
            from app.worker import log_action_task
            log_action_task.delay(
                user_id=user.id,
                action_type="action_executed",
                details={
                    "proposal_id": proposal.id, 
                    "type": proposal.type, 
                    "payload": json.loads(proposal.payload)
                }
            )
            
            return True
            
        except Exception as e:
            logger.error(f"Error executing proposal {proposal.id}: {e}")
            
            # Unified Async: Log Failure
            from app.worker import log_action_task
            log_action_task.delay(
                user_id=user.id,
                action_type="action_failed",
                details={"proposal_id": proposal.id, "error": str(e)},
                status="failed",
                error=str(e)
            )
            raise e
