import asyncio
import logging
from typing import Callable, Dict, List, Any, Awaitable

logger = logging.getLogger(__name__)

# Event Type Constants
EVENT_PROPOSAL_APPROVED = "proposal.approved"
EVENT_ACTION_SUCCESS = "action.success"
EVENT_ACTION_FAILED = "action.failed"
EVENT_PROPOSAL_REJECTED = "proposal.rejected"


class EventBus:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EventBus, cls).__new__(cls)
            cls._instance.subscribers = {}
        return cls._instance

    def __init__(self):
        # Already initialized in __new__
        pass
        
    def subscribe(self, event_type: str, handler: Callable[[Any], Awaitable[None]]):
        """
        Subscribe an async handler to an event type.
        """
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)
        logger.info(f"Subscribed to {event_type}")

    async def publish(self, event_type: str, payload: Any):
        """
        Publish an event to all subscribers.
        Handlers are executed asynchronously but awaited together.
        """
        if event_type not in self.subscribers:
             # logger.debug(f"No subscribers for {event_type}")
             return

        handlers = self.subscribers[event_type]
        logger.info(f"Publishing {event_type} to {len(handlers)} handlers")
        
        # Create tasks for all handlers
        tasks = [handler(payload) for handler in handlers]
        
        # Execute all concurrently
        # We use return_exceptions=True to prevent one listener from crashing the bus
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Error in event handler for {event_type}: {result}")

# Global Instance
event_bus = EventBus()
