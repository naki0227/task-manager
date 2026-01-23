import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.orm import Session
from app.main import app
from app.models import User, Proposal, ActionLog
from app.database import SessionLocal
from app.routers.login import create_access_token
import os

# Override settings to ensure Mock Mode is ON
os.environ["MOCK_EXTERNAL_APIS"] = "true"

@pytest.fixture
def db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def test_user(db: Session):
    # Create or get test user
    user = db.query(User).filter(User.email == "test@example.com").first()
    if not user:
        user = User(email="test@example.com", password_hash="hashed_secret")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@pytest.fixture
def auth_header(test_user):
    token = create_access_token(data={"sub": test_user.email, "user_id": test_user.id})
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_autonomous_approval_flow(db: Session, test_user: User, auth_header: dict):
    # 1. Setup: Create a Pending Proposal
    proposal = Proposal(
        user_id=test_user.id,
        title="Integration Test Proposal",
        description="Testing the full loop",
        type="slack_message",
        payload='{"channel_id": "C123", "text": "Hello World"}',
        status="pending"
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    
    # 2. Action: Approve via API
    headers = {
        "Authorization": auth_header["Authorization"],
        "Content-Type": "application/json"
    }
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.post(f"/api/proposals/{proposal.id}/approve", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    
    # 3. Verification: Wait for Worker to Process
    for _ in range(10): # Wait up to 10 seconds
        await asyncio.sleep(1)
        # Refresh session
        db.expire_all()
        p = db.query(Proposal).filter(Proposal.id == proposal.id).first()
        if p.status == "executed":
            break
            
    assert p.status == "executed", f"Proposal status is {p.status}, expected 'executed'"
    
    # 4. Verify Action Log
    log = db.query(ActionLog).filter(
        ActionLog.user_id == test_user.id,
        ActionLog.action_type == "action_executed"
    ).order_by(ActionLog.created_at.desc()).first()
    
    assert log is not None
    assert '"type": "slack_message"' in log.details
