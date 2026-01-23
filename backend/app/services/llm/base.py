from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class LLMProvider(ABC):
    """
    Abstract Base Class for LLM Providers (Gemini, OpenAI, Claude, etc.)
    """
    
    @abstractmethod
    async def generate_text(self, prompt: str) -> str:
        """Generate plain text response"""
        pass

    @abstractmethod
    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        """Generate JSON response"""
        pass
        
    @abstractmethod
    async def chat_compleation(self, messages: List[Dict[str, str]]) -> str:
        """Simple chat completion"""
        pass
