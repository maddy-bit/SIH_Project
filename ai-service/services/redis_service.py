import os
import json
import logging
import time
from typing import Optional, Dict, Any

logger = logging.getLogger("cityai.redis")

REDIS_HOST = os.environ.get("REDIS_HOST", "localhost")
REDIS_PORT = int(os.environ.get("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.environ.get("REDIS_PASSWORD", None)

try:
    import redis.asyncio as aioredis  # type: ignore
    _HAS_REDIS = True
except ImportError:
    _HAS_REDIS = False
    aioredis = None

class RedisService:
    def __init__(self):
        self.client = None
        self._connected = False
        self._in_memory_jobs: Dict[str, Dict[str, Any]] = {}
        self._in_memory_cache: Dict[str, Any] = {}

    async def initialize(self):
        if not _HAS_REDIS:
            logger.info("redis-py library not found. Operating in local memory fallback mode.")
            return

        try:
            self.client = aioredis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                password=REDIS_PASSWORD if REDIS_PASSWORD else None,
                socket_timeout=2.0,
                decode_responses=True,
            )
            await self.client.ping()
            self._connected = True
            logger.info(f"Connected to Redis cluster at {REDIS_HOST}:{REDIS_PORT}")
        except Exception as e:
            self._connected = False
            logger.warning(f"Could not connect to Redis at {REDIS_HOST}:{REDIS_PORT}: {e}. Falling back to in-memory mode.")

    async def check_health(self) -> Dict[str, Any]:
        if not self._connected or not self.client:
            return {"status": "STANDALONE_FALLBACK", "latency_ms": None}
        try:
            t0 = time.time()
            res = await self.client.ping()
            latency = round((time.time() - t0) * 1000, 2)
            if res:
                return {"status": "UP", "latency_ms": latency}
        except Exception:
            self._connected = False
        return {"status": "DOWN", "latency_ms": None}

    async def set_job_status(self, job_id: str, status: str, progress: float, details: Optional[Dict[str, Any]] = None):
        """Stores video ingestion job progress (e.g. status='processing', progress=45.5)."""
        payload = {
            "job_id": job_id,
            "status": status,
            "progress": progress,
            "updated_at": time.time(),
            "details": details or {}
        }
        if self._connected and self.client:
            try:
                key = f"cityai:job:{job_id}"
                await self.client.set(key, json.dumps(payload), ex=3600) # 1 hour TTL
                return
            except Exception as e:
                logger.debug(f"Redis write job error: {e}")
        # Fallback
        self._in_memory_jobs[job_id] = payload

    async def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves video ingestion job progress."""
        if self._connected and self.client:
            try:
                key = f"cityai:job:{job_id}"
                raw = await self.client.get(key)
                if raw:
                    return json.loads(raw)
            except Exception as e:
                logger.debug(f"Redis read job error: {e}")
        return self._in_memory_jobs.get(job_id)

    async def get_cached_plate(self, crop_hash: str) -> Optional[Dict[str, Any]]:
        """Checks if OCR plate detection is cached for this vehicle crop hash."""
        if self._connected and self.client:
            try:
                raw = await self.client.get(f"cityai:plate_cache:{crop_hash}")
                if raw:
                    return json.loads(raw)
            except Exception:
                pass
        return self._in_memory_cache.get(crop_hash)

    async def cache_plate(self, crop_hash: str, plate_text: str, confidence: float):
        """Caches OCR plate inference result to prevent duplicate processing on consecutive video frames."""
        payload = {"plate": plate_text, "confidence": confidence}
        if self._connected and self.client:
            try:
                await self.client.set(f"cityai:plate_cache:{crop_hash}", json.dumps(payload), ex=300) # 5 min TTL
                return
            except Exception:
                pass
        self._in_memory_cache[crop_hash] = payload

redis_service = RedisService()
