"""
Prompt Service
Loads prompts from prompts.yaml and provides templating.
"""

import os
import yaml
import logging
from functools import lru_cache
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

PROMPTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "prompts.yaml")

@lru_cache()
def _load_prompts() -> Dict[str, Any]:
    """Load prompts from YAML file."""
    try:
        with open(PROMPTS_PATH, "r") as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        logger.error(f"prompts.yaml not found at {PROMPTS_PATH}")
        return {}
    except yaml.YAMLError as e:
        logger.error(f"Error parsing prompts.yaml: {e}")
        return {}

def get_prompt(category: str, name: str, part: str = "user_template") -> Optional[str]:
    """
    Get a prompt template.
    
    Args:
        category: e.g., "autonomous_agent"
        name: e.g., "analyze_context"
        part: "system" or "user_template"
    
    Returns:
        The prompt string, or None if not found.
    """
    prompts = _load_prompts()
    try:
        return prompts[category][name][part]
    except KeyError:
        logger.warning(f"Prompt not found: {category}.{name}.{part}")
        return None

def render_prompt(category: str, name: str, part: str = "user_template", **kwargs) -> str:
    """
    Get and render a prompt with variables.
    
    Args:
        category: e.g., "autonomous_agent"
        name: e.g., "analyze_context"
        part: "system" or "user_template"
        **kwargs: Variables to substitute into the template.
    
    Returns:
        The rendered prompt string.
    """
    template = get_prompt(category, name, part)
    if template is None:
        return ""
    
    try:
        return template.format(**kwargs)
    except KeyError as e:
        logger.error(f"Missing variable in prompt template: {e}")
        return template
