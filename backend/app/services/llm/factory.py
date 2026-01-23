from functools import lru_cache
from app.config import get_settings
from app.services.llm.base import LLMProvider
from app.services.llm.gemini import GeminiProvider

class LLMFactory:
    @staticmethod
    def get_provider() -> LLMProvider:
        settings = get_settings()
        # In the future, check settings.llm_provider
        # For now, default to Gemini
        return GeminiProvider()

@lru_cache()
def get_llm_service() -> LLMProvider:
    return LLMFactory.get_provider()
