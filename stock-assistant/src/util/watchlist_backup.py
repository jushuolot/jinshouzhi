"""自选股 JSON 备份/导入（P21）。"""

from __future__ import annotations

import json
from datetime import datetime
from typing import Any

from src.util.currency import normalize_watchlist
from src.util.watch_groups import normalize_watch_groups

SCHEMA = "stock-assistant-watch-backup-v1"


def build_watch_backup(
    *,
    watchlist: list[dict[str, Any]],
    watch_snapshots: dict[str, Any],
    watch_groups: dict[str, list[str]] | None = None,
) -> dict[str, Any]:
    return {
        "schema": SCHEMA,
        "exported_at": datetime.now().strftime("%Y年%m月%d日 %H:%M:%S"),
        "watchlist": normalize_watchlist(list(watchlist)),
        "watch_snapshots": dict(watch_snapshots or {}),
        "watch_groups": normalize_watch_groups(watch_groups or {}),
    }


def backup_to_json_bytes(payload: dict[str, Any]) -> bytes:
    return json.dumps(payload, ensure_ascii=False, indent=2, default=str).encode("utf-8")


def parse_backup_bytes(raw: bytes) -> dict[str, Any]:
    data = json.loads(raw.decode("utf-8"))
    if not isinstance(data, dict):
        raise ValueError("备份文件格式无效")
    schema = str(data.get("schema") or "")
    if schema != SCHEMA:
        raise ValueError(f"不支持的备份 schema：{schema or '未知'}")
    return data


def merge_watchlist(
    existing: list[dict[str, Any]],
    incoming: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """按代码合并，保留已有项顺序，追加新代码。"""
    base = normalize_watchlist(list(existing))
    inc = normalize_watchlist(list(incoming))
    seen = {str(x.get("代码") or "") for x in base}
    out = list(base)
    for item in inc:
        code = str(item.get("代码") or "")
        if code and code not in seen:
            seen.add(code)
            out.append(item)
    return out


def merge_snapshots(
    existing: dict[str, Any],
    incoming: dict[str, Any],
) -> dict[str, Any]:
    out = dict(existing or {})
    for code, snap in (incoming or {}).items():
        if code and isinstance(snap, dict):
            out[str(code)] = dict(snap)
    return out


def merge_watch_groups(
    existing: dict[str, list[str]],
    incoming: dict[str, list[str]],
) -> dict[str, list[str]]:
    a = normalize_watch_groups(existing)
    b = normalize_watch_groups(incoming)
    out = {k: list(v) for k, v in a.items()}
    for g, codes in b.items():
        merged = list(dict.fromkeys((out.get(g) or []) + list(codes)))
        out[g] = merged
    return {k: v for k, v in out.items() if v}


def apply_backup_merge(
    *,
    watchlist: list[dict[str, Any]],
    watch_snapshots: dict[str, Any],
    watch_groups: dict[str, list[str]],
    backup: dict[str, Any],
) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, list[str]], dict[str, int]]:
    wl = merge_watchlist(watchlist, backup.get("watchlist") or [])
    snaps = merge_snapshots(watch_snapshots, backup.get("watch_snapshots") or {})
    groups = merge_watch_groups(watch_groups, backup.get("watch_groups") or {})
    stats = {
        "watchlist_added": max(0, len(wl) - len(watchlist)),
        "snapshots_merged": len(backup.get("watch_snapshots") or {}),
        "groups_merged": len(backup.get("watch_groups") or {}),
    }
    return wl, snaps, groups, stats
