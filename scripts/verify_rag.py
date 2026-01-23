
import requests
import json
import time

BASE_URL = "http://localhost:8000/api"
TEST_USER = {
    "email": "rag_tester@example.com",
    "password": "testpassword123",
    "name": "RAG Tester"
}

def run_verification():
    print("🚀 Starting RAG Verification...")

    # 1. Login or Signup
    print("Step 1: Authenticating...")
    token = None
    try:
        # Try login (Note: login router is at /auth)
        res = requests.post(f"http://localhost:8000/auth/login", json={"email": TEST_USER["email"], "password": TEST_USER["password"]})
        if res.status_code == 200:
            token = res.json()["access_token"]
            print("✅ Logged in successfully")
        else:
            # Try signup
            print("   (User not found, signing up...)")
            res = requests.post(f"http://localhost:8000/auth/signup", json=TEST_USER)
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

    # 2. Ingest Codebase
    print("\nStep 2: Ingesting Codebase (Vector RAG)...")
    try:
        start_time = time.time()
        # Endpoint is /api/rag/ingest
        res = requests.post(f"{BASE_URL}/rag/ingest", headers=headers)
        if res.status_code == 200:
            duration = time.time() - start_time
            print(f"✅ Ingestion complete in {duration:.2f}s")
            print(f"   Response: {res.json()}")
        else:
            print(f"❌ Ingestion failed: {res.text}")
            return
    except Exception as e:
        print(f"❌ Ingestion error: {e}")
        return

    # 3. Query Codebase
    print("\nStep 3: Querying Codebase...")
    test_query = "How is the chat interface implemented?"
    print(f"   Query: '{test_query}'")
    
    try:
        res = requests.post(
            f"{BASE_URL}/rag/query", 
            headers=headers,
            json={"query": test_query, "n_results": 2}
        )
        if res.status_code == 200:
            results = res.json()["results"]
            print(f"✅ Query successful! Found {len(results)} results.")
            for i, r in enumerate(results):
                print(f"   --- Result {i+1} (Score: {r['score']:.4f}) ---")
                print(f"   Source: {r['source']}")
                print(f"   Snippet: {r['content'][:200]}...") # Show first 200 chars
                print("   ---------------------------")
        else:
            print(f"❌ Query failed: {res.text}")
            return
    except Exception as e:
        print(f"❌ Query error: {e}")
        return
        
    print("\n🎉 RAG Verification PASSED!")

if __name__ == "__main__":
    run_verification()
