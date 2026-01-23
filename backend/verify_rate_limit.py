
import asyncio
import sys
import os
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'app')) # Assuming run from backend/ dir

from app.core.redis import redis_client
from app.services.safety import SafetyService, MAX_ACTIONS_PER_HOUR
from app.database import SessionLocal

async def test_rate_limit():
    print("Testing Rate Limit...")
    
    # Init Redis
    try:
        await redis_client.init_redis()
    except Exception as e:
        print(f"FAIL: Logic looks good but Redis is not reachable. Did you run `docker-compose up`? Error: {e}")
        return

    db = SessionLocal()
    safety = SafetyService(db)
    user_id = 99999 # Test User

    print(f"Simulating {MAX_ACTIONS_PER_HOUR + 5} actions for user {user_id}...")
    
    # Reset limit first (manual key deletion for test)
    r = redis_client.get_client()
    await r.delete(f"rate_limit:{user_id}")
    
    success_count = 0
    fail_count = 0
    
    for i in range(MAX_ACTIONS_PER_HOUR + 5):
        allowed = await safety.check_rate_limit(user_id)
        if allowed:
            success_count += 1
            print(f"Action {i+1}: Allowed")
        else:
            fail_count += 1
            print(f"Action {i+1}: Blocked")
            
    await redis_client.close_redis()
    
    print("-" * 20)
    print(f"Total: {MAX_ACTIONS_PER_HOUR + 5}")
    print(f"Allowed: {success_count}")
    print(f"Blocked: {fail_count}")
    
    if success_count == MAX_ACTIONS_PER_HOUR and fail_count == 5:
        print("SUCCESS: Rate limit enforced correctly.")
    else:
        print("FAIL: Rate limit logic is incorrect.")

if __name__ == "__main__":
    asyncio.run(test_rate_limit())
