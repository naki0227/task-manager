
import logging
import json
from datetime import datetime
from typing import List, Dict, Any

from app.services.llm.factory import get_llm_service

logger = logging.getLogger(__name__)

class ReasoningService:
    def __init__(self):
        self.llm = get_llm_service()

    async def analyze_context_and_propose(self, rag_context: List[Dict[str, Any]], task_context: str) -> List[Dict[str, Any]]:
        """
        Analyze the provided context and generate proposals using Gemini.
        """
        # Truncate RAG context to fit token limit
        from app.services.token import get_token_service
        token_service = get_token_service()
        
        # Max 20k tokens for context, leaving 10k for tasks & prompt overhead
        truncated_rag_context = token_service.truncate_rag_context(rag_context, max_tokens=20000)
        
        # Load prompt from registry
        from app.services.prompt import render_prompt
        
        prompt = render_prompt(
            "autonomous_agent", 
            "analyze_context", 
            "user_template",
            current_time=datetime.now(),
            rag_context=truncated_rag_context,
            task_context=task_context
        )
        
        try:
            result = await self.llm.generate_json(prompt)
            proposals = result.get("proposals", [])
            logger.info(f"ReasoningService generated {len(proposals)} proposals")
            return proposals
        except Exception as e:
            logger.error(f"ReasoningService failed: {e}")
            return []
