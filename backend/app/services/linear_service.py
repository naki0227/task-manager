"""
Linear API Service
Linear GraphQL API interaction
"""

import httpx
from typing import List, Dict, Any, Optional
from app.config import get_settings

LINEAR_API_URL = "https://api.linear.app/graphql"
LINEAR_OAUTH_TOKEN_URL = "https://api.linear.app/oauth/token"

class LinearService:
    """Linear API Service"""

    @staticmethod
    async def exchange_code_for_token(code: str) -> str:
        """
        Exchange OAuth code for access token
        """
        settings = get_settings()
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LINEAR_OAUTH_TOKEN_URL,
                data={
                    "code": code,
                    "redirect_uri": f"{settings.backend_url}/auth/linear/callback",
                    "client_id": settings.linear_client_id,
                    "client_secret": settings.linear_client_secret,
                    "grant_type": "authorization_code",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            data = response.json()
            if "access_token" not in data:
                raise Exception(f"Linear OAuth error: {data}")
            
            return data["access_token"]

    @staticmethod
    async def fetch_viewer_info(access_token: str) -> Dict[str, Any]:
        """Get current user info"""
        query = """
        query Me {
            viewer {
                id
                name
                email
            }
        }
        """
        return await LinearService._graphql_query(access_token, query)

    @staticmethod
    async def fetch_assigned_issues(access_token: str) -> List[Dict[str, Any]]:
        """
        Fetch issues assigned to the viewer
        """
        # Fetch high priority or active issues
        query = """
        query MyIssues {
            viewer {
                assignedIssues(
                    filter: { 
                        state: { type: { nin: ["completed", "canceled"] } } 
                    }
                    orderBy: updatedAt
                ) {
                    nodes {
                        id
                        identifier
                        title
                        description
                        priority
                        dueDate
                        state {
                            name
                            type
                        }
                        url
                    }
                }
            }
        }
        """
        
        data = await LinearService._graphql_query(access_token, query)
        if not data:
            return []
            
        return data.get("viewer", {}).get("assignedIssues", {}).get("nodes", [])

    @staticmethod
    async def _graphql_query(access_token: str, query: str) -> Dict[str, Any]:
        """Execute GraphQL query"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                LINEAR_API_URL,
                json={"query": query},
                headers={"Authorization": f"Bearer {access_token}"}
            )
            
            if response.status_code != 200:
                raise Exception(f"Linear API error: {response.text}")
                
            result = response.json()
            if "errors" in result:
                raise Exception(f"GraphQL Errors: {result['errors']}")
                
            return result.get("data", {})
