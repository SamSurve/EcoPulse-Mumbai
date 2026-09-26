import time
from collections import OrderedDict
from threading import Lock
from typing import Any, Dict, Optional, Tuple


class InMemoryTTLCache:
    """
    Lightweight, thread-safe, bounded in-memory cache with Time-To-Live (TTL) expiration
    and Least-Recently-Used (LRU) eviction.
    Prevents memory leaks from unbounded key growth without requiring Redis.
    """

    def __init__(self, default_ttl_seconds: int = 900, maxsize: int = 1000):
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
        self._lock = Lock()
        self._default_ttl = default_ttl_seconds
        self._maxsize = maxsize
        self._hits: int = 0
        self._misses: int = 0
        self._evictions: int = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                self._misses += 1
                return None
            value, expiry = self._cache[key]
            if time.time() > expiry:
                del self._cache[key]
                self._misses += 1
                return None
            # Move to end on access for LRU tracking
            self._cache.move_to_end(key)
            self._hits += 1
            return value

    def set(self, key: str, value: Any, ttl_seconds: Optional[int] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self._default_ttl
        expiry = time.time() + ttl
        now = time.time()

        with self._lock:
            if key in self._cache:
                self._cache[key] = (value, expiry)
                self._cache.move_to_end(key)
                return

            # If cache has reached maximum capacity, purge expired keys first
            if len(self._cache) >= self._maxsize:
                expired = [k for k, (_, exp) in self._cache.items() if now > exp]
                for k in expired:
                    del self._cache[k]

            # If still at or exceeding capacity, evict the least recently used item (first item)
            if len(self._cache) >= self._maxsize:
                self._cache.popitem(last=False)
                self._evictions += 1

            self._cache[key] = (value, expiry)

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._hits = 0
            self._misses = 0
            self._evictions = 0

    def size(self) -> int:
        with self._lock:
            now = time.time()
            expired = [k for k, (_, exp) in self._cache.items() if now > exp]
            for k in expired:
                del self._cache[k]
            return len(self._cache)

    def stats(self) -> Dict[str, Any]:
        """Return operational telemetry metrics for health monitoring."""
        with self._lock:
            total_requests = self._hits + self._misses
            hit_ratio = round((self._hits / total_requests), 3) if total_requests > 0 else 0.0
            return {
                "size": len(self._cache),
                "maxsize": self._maxsize,
                "hits": self._hits,
                "misses": self._misses,
                "evictions": self._evictions,
                "hit_ratio": hit_ratio
            }


# Global application cache instance
try:
    from app.config import settings
    cache = InMemoryTTLCache(
        default_ttl_seconds=settings.CACHE_TTL_SECONDS,
        maxsize=settings.MAX_CACHE_SIZE
    )
except Exception:
    cache = InMemoryTTLCache(default_ttl_seconds=900, maxsize=1000)
