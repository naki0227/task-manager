import json
import google.generativeai as genai
from typing import Dict, Any, List
from app.config import get_settings
from app.services.llm.base import LLMProvider

class GeminiProvider(LLMProvider):
    """
    Gemini Implementation of LLMProvider
    """
    
    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash-exp")

    async def generate_text(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API Error: {e}")
            raise

    async def generate_json(self, prompt: str) -> Dict[str, Any]:
        response_text = await self.generate_text(prompt)
        json_text = self._extract_json(response_text)
        return json.loads(json_text)
        
    async def chat_compleation(self, messages: List[Dict[str, str]]) -> str:
        # Convert standard OpenAI-style messages to Gemini history if needed
        # For simplicity, we just concatenate or use the last message for now
        # Ideally, we should map roles.
        # Gemini expects: [{'role': 'user', 'parts': ['...']}, ...]
        
        gemini_messages = []
        for msg in messages:
            role = "user" if msg["role"] == "user" else "model"
            gemini_messages.append({"role": role, "parts": [msg["content"]]})
            
        try:
            response = self.model.generate_content(gemini_messages)
            return response.text
        except Exception as e:
             print(f"Gemini Chat Error: {e}")
             raise

    def _extract_json(self, text: str) -> str:
        text = text.strip()
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "```" in text:
            text = text.split("```")[1].split("```")[0]
        return text.strip()
