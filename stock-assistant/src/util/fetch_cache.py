"""自选股摘要刷新 in-session 缓存（P29）。"""

from __future__ import annotations

import time
from typing import Any

DEFAULT_TTL_SECONDS = 60.0

_cache: dict[str, tuple[float, dict[str, dict[str, Any]]]] = {}


def batch_cache_key(codes: list[str]) -> str:
    return "|".join(sorted(c for c in codes if c))


def get_cached_snapshots(
    codes: list[str],
    *,
    ttl: float = DEFAULT_TTL_SECONDS,
    now: float | None = None,
) -> dict[str, dict[str, Any]] | None:
    key = batch_cache_key(codes)
    if not key:
        return None
    entry = _cache.get(key)
    if not entry:
        return None
    ts, snapshots = entry
    t = now if now is not None else time.time()
    if (t - ts) > float(ttl):
        _cache.pop(key, None)
        return None
    return dict(snapshots)


def set_cached_snapshots(
    codes: list[str],
    snapshots: dict[str, dict[str, Any]],
    *,
    now: float | None = None,
) -> None:
    key = batch_cache_key(codes)
    if not key:
        return
    _cache[key] = ((now if now is not None else time.time()), dict(snapshots))


def clear_fetch_cache() -> None:
    _cache.clear()
