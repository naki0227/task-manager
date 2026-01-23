import re
from playwright.sync_api import Page, expect

def test_dashboard_shows_proposals(page: Page):
    # Mock the proposals API to return a controlled response
    page.route("**/api/proposals?*", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='[{"id": 1, "title": "Test AI Proposal", "description": "This is a mock proposal for E2E testing", "type": "create_task", "payload": "{}", "status": "pending", "risk_level": "low", "created_at": "2024-01-01T00:00:00"}]'
    ))

    # Mock other APIs to prevent errors (Account, etc.)
    page.route("**/api/users/me", lambda route: route.fulfill(
        status=200,
        content_type="application/json",
        body='{"id": 1, "name": "Test User", "email": "test@example.com"}'
    ))
    
    # Mock Stats
    page.route("**/api/stats/monthly*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))
    
    # Mock Tasks
    page.route("**/api/tasks*", lambda route: route.fulfill(
        status=200, content_type="application/json", body='[]'
    ))

    # Go to Dashboard
    page.goto("http://localhost:3000/")

    # Expect to see the "AI Proposals" header
    expect(page.get_by_text("AI Proposals")).to_be_visible()

    # Expect to see the mock proposal title
    expect(page.get_by_text("Test AI Proposal")).to_be_visible()
    
    # Expect to see the description
    expect(page.get_by_text("This is a mock proposal for E2E testing")).to_be_visible()
