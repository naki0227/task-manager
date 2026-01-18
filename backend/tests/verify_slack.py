import sys
import os
import asyncio
import json

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import OAuthToken, User
from app.services.slack_service import SlackService
from app.services.gemini_service import get_gemini_service

async def main():
    print("=== Slack Integration Verification ===")
    
    db = SessionLocal()
    try:
        # 1. Get Token
        print("\n[1] Checking Database for Slack Token...")
        # Get the most recent token (assuming single user testing or just grab first one)
        token = db.query(OAuthToken).filter(OAuthToken.provider == "slack").order_by(OAuthToken.updated_at.desc()).first()
        
        if not token:
            print("❌ No Slack token found in database.")
            print("Please authenticate first by visiting: https://backboned-bicentrically-franklyn.ngrok-free.dev/auth/slack")
            return

        user = db.query(User).filter(User.id == token.user_id).first()
        print(f"✅ Found token for user: {user.email if user else 'Unknown'}")
        print(f"   Token: {token.access_token[:10]}...{token.access_token[-5:]}")
        
        # 2. Fetch Messages
        print("\n[2] Fetching recent messages from Slack...")
        try:
            messages = await SlackService.fetch_recent_messages(token.access_token, hours=72) # Look back 72 hours to ensure we find something
            if not messages:
                print("⚠️ No messages found in the last 72 hours.")
                print("Join a channel and post a message like 'TODO: Review this code' to test.")
            else:
                print(f"✅ Found {len(messages)} potential task messages.")
                for i, msg in enumerate(messages[:3]):
                    print(f"   - [{msg['channel']}] {msg['text'][:50]}...")
        except Exception as e:
            print(f"❌ Error fetching from Slack: {e}")
            return

        if not messages:
            return

        # 3. Gemini Analysis
        print("\n[3] Testing Gemini Task Extraction...")
        gemini = get_gemini_service()
        try:
            tasks = await gemini.extract_tasks_from_slack_messages(messages)
            print(f"✅ Gemini extracted {len(tasks)} tasks.")
            print(json.dumps(tasks, indent=2, ensure_ascii=False))
        except Exception as e:
            print(f"❌ Error from Gemini: {e}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
