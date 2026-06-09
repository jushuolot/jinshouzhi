"""云端推荐成绩单：GitHub nightly 写入，跨终端共享命中率（P124）。"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path
from typing import Any, Callable

from src.analysis.pick_review import pattern_score_adjustments_from_log, strategy_hints_from_reviews
from src.analysis.pick_tracker import (
    append_today_picks,
    hit_rate_summary,
    normalize_pick_log,
    verify_log,
)
from src.storage.paths import project_root

CLOUD_PICK_LOG = project_root() / "cloud_state" / "cloud_pick_log.json"


def load_cloud_pick_log(path: Path | None = None) -> list[dict[str, Any]]:
    p = path or CLOUD_PICK_LOG
    if not p.is_file():
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    if isinstance(data, dict):
        return normalize_pick_log(data.get("records") or [])
    return normalize_pick_log(data)


def save_cloud_pick_log(log: list[dict[str, Any]], *, path: Path | None = None) -> Path:
    p = path or CLOUD_PICK_LOG
    p.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "updated_at": date.today().isoformat(),
        "records": normalize_pick_log(log)[-200:],
        "hit_summary": hit_rate_summary(log),
    }
    p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return p


FetchRankingFn = Callable[[], tuple[Any, str]]


def pct_map_from_ranking(df: Any) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    if df is None or getattr(df, "empty", True):
        return out
    for _, row in df.iterrows():
        code = str(row.get("代码") or "").replace(".0", "").strip()
        try:
            out[code] = float(row.get("涨跌幅%"))
        except (TypeError, ValueError):
            out[code] = None
    return out


def sync_cloud_pick_log(
    picks: list[Any],
    *,
    pick_day: str,
    fetch_ranking: FetchRankingFn,
    path: Path | None = None,
) -> dict[str, Any]:
    """追加今日推荐、验证到期记录、写盘并返回元数据。"""
    log = load_cloud_pick_log(path=path)
    log = append_today_picks(log, picks, day=pick_day)
    try:
        rank_df, _ = fetch_ranking()
        pct_map = pct_map_from_ranking(rank_df)
        log = verify_log(log, pct_map)
    except Exception:
        pass
    save_cloud_pick_log(log, path=path)
    summary = hit_rate_summary(log)
    summary["source"] = "cloud"
    hints = _strategy_hints_from_log(log)
    return {"log": log, "hit_summary": summary, "strategy_hints": hints}


def _strategy_hints_from_log(log: list[dict[str, Any]]) -> list[str]:
    verified = [r for r in normalize_pick_log(log) if r.get("verified")]
    if not verified:
        return []
    from src.analysis.pick_review import Pick3dReview

    pseudo: list[Pick3dReview] = []
    for r in verified[-12:]:
        hit = r.get("hit")
        if hit is None:
            continue
        pseudo.append(
            Pick3dReview(
                pick_date=str(r.get("pick_date") or ""),
                code=str(r.get("code") or ""),
                name=str(r.get("name") or ""),
                pattern=str(r.get("pattern") or "未知"),
                pick_close=None,
                ret_d1_pct=None,
                ret_d2_pct=None,
                ret_d3_pct=None,
                max_ret_3d_pct=r.get("end_pct"),
                hit_3d=bool(hit),
                note=str(r.get("note") or ""),
            )
        )
    hints = strategy_hints_from_reviews(pseudo) if pseudo else []
    adj = pattern_score_adjustments_from_log(log)
    for pat, delta in sorted(adj.items(), key=lambda x: x[1]):
        if delta < 0:
            hints.append(f"扫盘权重：「{pat}」{delta:+.1f}分（近绩偏弱）")
        elif delta > 0:
            hints.append(f"扫盘权重：「{pat}」+{delta:.1f}分（近绩偏强）")
    return hints[:6]


def load_cloud_pick_meta(path: Path | None = None) -> dict[str, Any] | None:
    p = path or CLOUD_PICK_LOG
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(data, dict):
        return None
    return data
