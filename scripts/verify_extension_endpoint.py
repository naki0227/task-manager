import requests
import json

BASE_URL = "http://localhost:8000/api"
AUTH_URL = "http://localhost:8000/auth"

TEST_USER = {
    "email": "test_extension@example.com",
    "password": "ExtensionPassword123!"
}

def run_test():
    print("🚀 Verifying Extension Endpoint...")

    # 1. Auth
    print("Step 1: Authenticating...")
    token = None
    try:
        res = requests.post(f"{AUTH_URL}/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
        if res.status_code == 200:
            token = res.json()["access_token"]
        else:
            res = requests.post(f"{AUTH_URL}/signup", json=TEST_USER)
            token = res.json()["access_token"]
    except Exception as e:
        print(f"❌ Auth failed: {e}")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Post Snapshot with 'windows' payload
    print("Step 2: Sending Snapshot from 'Extension'...")
    payload = {
        "name": "Test Snapshot from Extension",
        "notes": "Captured via script",
        "windows": [
            {
                "type": "browser",
                "name": "Test Window",
                "urls": ["https://google.com", "https://github.com"]
            }
        ]
    }
    
    res = requests.post(f"{BASE_URL}/snapshots", headers=headers, json=payload)
    if res.status_code == 200:
        data = res.json()
        print("✅ Snapshot Created!")
        print(f"   ID: {data['id']}")
        print(f"   Windows: {data['windows']}")
        
        # Verify content
        if data['windows'][0]['name'] == "Test Window":
            print("✅ Payload correctly saved.")
        else:
            print("❌ Payload mismatch.")
    else:
        print(f"❌ Failed: {res.status_code} {res.text}")

if __name__ == "__main__":
    run_test()
