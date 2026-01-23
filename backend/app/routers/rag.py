from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.users import get_current_user
from app.services.ingestion import IngestionService

router = APIRouter()

@router.post("/rag/ingest/calendar")
async def ingest_calendar(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Manually trigger calendar ingestion for RAG context
    """
    user = get_current_user(authorization, db)
    service = IngestionService(db)
    count = await service.ingest_user_calendar(user.id)
    return {"message": "Success", "ingested_documents": count}

@router.post("/rag/ingest/gmail")
async def ingest_gmail(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Manually trigger Gmail ingestion for the current user.
    """
    user = get_current_user(authorization, db)
    service = IngestionService(db)
    count = await service.ingest_user_emails(user.id)
    return {"message": f"Ingested {count} emails", "count": count}

@router.post("/rag/ingest/slack")
async def ingest_slack(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    """
    Manually trigger Slack ingestion for the current user.
    """
    user = get_current_user(authorization, db)
    service = IngestionService(db)
    count = await service.ingest_user_slack(user.id)
    return {"message": f"Ingested {count} slack messages", "count": count}
