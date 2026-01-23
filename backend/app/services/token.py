
import logging
import tiktoken
from typing import List, Dict

logger = logging.getLogger(__name__)

# Constants
# Gemini 1.5 Pro has 1M context, but let's be conservative to save cost and latency.
# Input Token Price: $3.50 / 1M tokens. 
# Let's cap a single reasoning request at ~30k tokens for v1.1.
MAX_INPUT_TOKENS = 30000 

class TokenService:
    def __init__(self, model_name: str = "cl100k_base"):
        # Gemini uses a different tokenizer, but cl100k_base (OpenAI) is a good enough proxy for estimation.
        # Alternatively, google-generativeai client might have a count_tokens method (which is an API call).
        # To avoid extra latency/calls, we use tiktoken for local estimation.
        try:
            self.encoding = tiktoken.get_encoding(model_name)
        except Exception:
            self.encoding = tiktoken.get_encoding("cl100k_base")

    def count_tokens(self, text: str) -> int:
        try:
            return len(self.encoding.encode(text))
        except Exception as e:
            logger.error(f"Token counting failed: {e}")
            return len(text) // 4 # Rough fallback

    def truncate_rag_context(self, context_items: List[Dict], max_tokens: int = 20000) -> str:
        """
        Takes a list of RAG result dicts and constructs a context string 
        that fits within max_tokens.
        """
        current_tokens = 0
        final_context_parts = []
        
        # Assume context_items are already sorted by relevance (RAGService does this)
        for item in context_items:
            content = item.get("content", "")
            source = item.get("source", "unknown")
            
            # Format: "- Content (Source)"
            entry = f"- {content} (Source: {source})\n"
            entry_tokens = self.count_tokens(entry)
            
            if current_tokens + entry_tokens > max_tokens:
                logger.info(f"Truncating context at token limit: {current_tokens}/{max_tokens}")
                break
                
            final_context_parts.append(entry)
            current_tokens += entry_tokens
            
        return "".join(final_context_parts)

# Singleton
_token_service = None

def get_token_service():
    global _token_service
    if _token_service is None:
        _token_service = TokenService()
    return _token_service
