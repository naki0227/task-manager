
import redis.asyncio as redis
import logging
from app.config import get_settings

logger = logging.getLogger(__name__)

class RedisClient:
    _instance = None
    
    def __init__(self):
        self.client = None
        
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
        
    async def init_redis(self):
        settings = get_settings()
        logger.info(f"Connecting to Redis at {settings.redis_url}")
        self.client = redis.from_url(
            settings.redis_url, 
            encoding="utf-8", 
            decode_responses=True
        )
        try:
            await self.client.ping()
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise e
            
    async def close_redis(self):
        if self.client:
            await self.client.close()
            logger.info("Redis connection closed")

    def get_client(self):
        if not self.client:
             raise Exception("Redis not initialized")
        return self.client

redis_client = RedisClient.get_instance()
