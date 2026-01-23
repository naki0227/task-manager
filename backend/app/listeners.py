
import logging
from app.events import event_bus, EVENT_ACTION_SUCCESS, EVENT_ACTION_FAILED
from app.database import SessionLocal
from app.services.safety import SafetyService

logger = logging.getLogger(__name__)

async def handle_action_success(payload: dict):
    """
    Log successful action execution.
    """
    user_id = payload.get("user_id")
    proposal_type = payload.get("type")
    proposal_id = payload.get("proposal_id")
    
    logger.info(f"[Listener] Action Success: {proposal_type} for user {user_id}")
    
    db = SessionLocal()
    try:
        safety = SafetyService(db)
        safety.log_action(
            user_id=user_id,
            action_type="execution_success",
            resource_type=proposal_type,
            details={"proposal_id": proposal_id},
            risk_level="low" # Execution success is info
        )
        db.commit()
    except Exception as e:
        logger.error(f"[Listener] Failed to log success: {e}")
        db.rollback()
    finally:
        db.close()

async def handle_action_failed(payload: dict):
    """
    Log failed action execution.
    """
    user_id = payload.get("user_id")
    proposal_type = payload.get("type")
    proposal_id = payload.get("proposal_id")
    error = payload.get("error")
    
    logger.error(f"[Listener] Action Failed: {proposal_type} for user {user_id} - {error}")
    
    db = SessionLocal()
    try:
        safety = SafetyService(db)
        safety.log_action(
            user_id=user_id,
            action_type="execution_failed",
            resource_type=proposal_type,
            details={"proposal_id": proposal_id, "error": error},
            risk_level="high" # Failure might need attention
        )
        db.commit()
    except Exception as e:
        logger.error(f"[Listener] Failed to log failure: {e}")
        db.rollback()
    finally:
        db.close()

def register_listeners():
    """
    Register all event listeners.
    """
    event_bus.subscribe(EVENT_ACTION_SUCCESS, handle_action_success)
    event_bus.subscribe(EVENT_ACTION_FAILED, handle_action_failed)
    logger.info("Event listeners registered")
