import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
AUTH_URL = "http://localhost:8000/auth"

# Test User Credentials
TEST_USER = {
    "email": "test_verification@example.com",
    "password": "VerifyPassword123!"
}

def run_test():
    print("🚀 Starting Human-in-the-Loop Verification...")

    # 1. Login/Signup
    print("Step 1: Authenticating...")
    token = None
    try:
        res = requests.post(f"{AUTH_URL}/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
        if res.status_code == 200:
            token = res.json()["access_token"]
            print("✅ Logged in successfully")
        else:
            res = requests.post(f"{AUTH_URL}/signup", json=TEST_USER)
            if res.status_code == 200:
                token = res.json()["access_token"]
                print("✅ Signed up successfully")
            else:
                print(f"❌ Auth failed: {res.text}")
                return
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Trigger Sensitive Action (Add Task)
    print("\nStep 2: Triggering Sensitive Action (Add Task)...")
    chat_payload = {
        "message": "Add a task 'Buy Milk' please"
    }
    
    res = requests.post(f"{BASE_URL}/chat", headers=headers, json=chat_payload)
    if res.status_code != 200:
        print(f"❌ Chat request failed: {res.status_code} {res.text}")
        return

    data = res.json()
    response_text = data.get("response", "")
    print(f"   AI Response: {response_text}")

    # 3. Verify Response is a Proposal
    is_proposal = False
    proposal_data = None
    try:
        proposal_data = json.loads(response_text)
        if proposal_data.get("type") == "proposal":
            is_proposal = True
            print("✅ Received PROPOSAL as expected!")
            print(f"   Tool: {proposal_data['tool']}")
            print(f"   Args: {proposal_data['args']}")
        else:
            print("❌ Received JSON but not a proposal (type mismatch)")
    except Exception:
        print("❌ Received plain text, expected JSON proposal.")
        return

    if not is_proposal:
        return

    # 4. Confirm Action
    print("\nStep 3: Confirming Action...")
    confirm_payload = {
        "tool": proposal_data["tool"],
        "args": proposal_data["args"]
    }
    
    res = requests.post(f"{BASE_URL}/chat/confirm", headers=headers, json=confirm_payload)
    if res.status_code == 200:
        print("✅ Confirmation successful!")
        print(f"   Result: {res.json()}")
    else:
        print(f"❌ Confirmation failed: {res.status_code} {res.text}")
        return

    # 5. Verify Task was Added
    # (Optional, but good for completeness)
    # We assume 'add_task' returns success.

    print("\n🎉 Human-in-the-Loop Verification PASSED!")

if __name__ == "__main__":
    run_test()
