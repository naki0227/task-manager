"""
Test DB Save functionality for Slack tasks
This script directly calls the sync function to verify DB persistence.
"""
import sys
import os
import asyncio

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models import OAuthToken, Task
from app.routers.slack import sync_slack_tasks_task

async def main():
    print("=== DB Save Test ===")
    
    db = SessionLocal()
    try:
        # Get user with Slack token
        token = db.query(OAuthToken).filter(OAuthToken.provider == "slack").first()
        
        if not token:
            print("❌ No Slack token found. Please authenticate first.")
            return
        
        user_id = token.user_id
        print(f"✅ Found token for user_id: {user_id}")
        
        # Count tasks before sync
        before_count = db.query(Task).filter(Task.user_id == user_id, Task.source == "slack").count()
        print(f"📊 Tasks before sync: {before_count}")
        
    finally:
        db.close()
    
    # Run the sync task (this creates its own DB session)
    print("\n⏳ Running sync_slack_tasks_task...")
    await sync_slack_tasks_task(user_id)
    print("✅ Sync completed!")
    
    # Check results
    db = SessionLocal()
    try:
        after_count = db.query(Task).filter(Task.user_id == user_id, Task.source == "slack").count()
        print(f"📊 Tasks after sync: {after_count}")
        
        if after_count > before_count:
            print(f"🎉 {after_count - before_count} new tasks saved to DB!")
        elif after_count == before_count:
            print("ℹ️ No new tasks (duplicates or no new messages)")
        
        # Show saved tasks
        tasks = db.query(Task).filter(Task.user_id == user_id, Task.source == "slack").all()
        print("\n📋 Slack Tasks in DB:")
        for task in tasks:
            print(f"  - [{task.status}] {task.title}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main())
