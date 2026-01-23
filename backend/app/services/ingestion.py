import logging
from typing import List, Dict
from sqlalchemy.orm import Session
from app.services.rag_service import get_rag_service
from app.models import OAuthToken
from app.routers.google import fetch_calendar_events # Potential circular import, watching carefully
from app.services.encryption import decrypt_token

logger = logging.getLogger(__name__)

class IngestionService:
    def __init__(self, db: Session):
        self.db = db
        self.rag = get_rag_service()

    async def ingest_user_calendar(self, user_id: int):
        """
        Fetch user's calendar events and ingest into RAG
        """
        # 1. Get Google Token
        token = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == "google"
        ).first()

        if not token:
            logger.warning(f"No Google token found for user {user_id}")
            return 0

        # 2. Fetch Events (Past 7 days + Future 30 days?)
        # Default fetch_calendar_events uses generic range, let's stick to default for now or customize if needed.
        # The router function accepts `days` but defaults to 7. 
        # We might want a longer range for "Context".
        try:
            # Re-using router logic. ideally this should be in a separate service layer.
            events = await fetch_calendar_events(decrypt_token(token.access_token), days=30)
        except Exception as e:
            logger.error(f"Failed to fetch calendar for user {user_id}: {e}")
            return 0

        if not events:
            return 0

        # 3. Format as Documents
        documents = []
        for event in events:
            # Creative formatting for LLM
            content = f"Calendar Event: {event.title}\nTime: {event.start} to {event.end}\nDescription: {event.description}"
            documents.append({
                "content": content,
                "metadata": {
                    "source": "google_calendar",
                    "type": "event",
                    "user_id": str(user_id),
                    "event_id": event.id,
                    "timestamp": event.start
                }
            })

        # 4. Ingest
        count = await self.rag.ingest_documents(documents)
        logger.info(f"Ingested {count} calendar events for user {user_id}")
        return count

    async def ingest_user_emails(self, user_id: int):
        """
        Fetch user's recent Gmails and ingest into RAG
        """
        from app.routers.gmail import fetch_gmail_emails
        
        token = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == "google"
        ).first()

        if not token:
            logger.warning(f"No Google token found for user {user_id}")
            return 0

        try:
            emails = await fetch_gmail_emails(decrypt_token(token.access_token), limit=20)
        except Exception as e:
            logger.error(f"Failed to fetch emails for user {user_id}: {e}")
            return 0

        if not emails:
            return 0

        documents = []
        for email in emails:
            # Format: "Email from <Sender>: <Subject>\n<Snippet>..."
            content = f"Email from {email.sender}\nSubject: {email.subject}\nSnippet: {email.snippet}"
            documents.append({
                "content": content,
                "metadata": {
                    "source": "gmail",
                    "type": "email",
                    "user_id": str(user_id),
                    "email_id": email.id,
                    "timestamp": email.date
                }
            })

        count = await self.rag.ingest_documents(documents)
        logger.info(f"Ingested {count} emails for user {user_id}")
        return count

    async def ingest_user_slack(self, user_id: int):
        """
        Fetch user's recent Slack messages and ingest into RAG
        """
        from app.services.slack_service import SlackService
        from app.models import OAuthToken
        
        token = self.db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.provider == "slack"
        ).first()

        if not token:
            logger.warning(f"No Slack token found for user {user_id}")
            return 0

        try:
            # Fetch last 48 hours for broader context
            messages = await SlackService.fetch_recent_messages(decrypt_token(token.access_token), hours=48)
        except Exception as e:
            logger.error(f"Failed to fetch slack messages for user {user_id}: {e}")
            return 0

        if not messages:
            return 0

        documents = []
        for msg in messages:
            # Format: "Slack in #<channel>: <message>"
            content = f"Slack in #{msg['channel']}: {msg['text']}"
            documents.append({
                "content": content,
                "metadata": {
                    "source": "slack",
                    "type": "message",
                    "user_id": str(user_id),
                    "timestamp": str(msg.get("timestamp"))
                }
            })

        count = await self.rag.ingest_documents(documents)
        logger.info(f"Ingested {count} slack messages for user {user_id}")
        return count

