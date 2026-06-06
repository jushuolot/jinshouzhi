"""自选股阈值提醒（P13）。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WatchAlert:
    code: str
    name: str
    kind: str
    message: str
    level: str  # info | warn | hot


def compute_watch_alerts(
    watchlist: list[dict[str, Any]],
    snapshots: dict[str, Any],
    *,
    pct_up: float = 5.0,
    pct_down: float = -5.0,
    score_low: float = 40.0,
    score_high: float = 65.0,
) -> list[WatchAlert]:
    alerts: list[WatchAlert] = []
    for item in watchlist:
        code = str(item.get("代码") or "")
        name = str(item.get("名称") or code)
        snap = snapshots.get(code) or {}
        pct = snap.get("pct")
        score = snap.get("score")
        try:
            p = float(pct) if pct is not None else None
        except (TypeError, ValueError):
            p = None
        try:
            s = float(score) if score is not None else None
        except (TypeError, ValueError):
            s = None
        if p is not None and p >= pct_up:
            alerts.append(
                WatchAlert(code, name, "hot", f"涨 {p:+.2f}%（≥{pct_up}%）", "hot")
            )
        elif p is not None and p <= pct_down:
            alerts.append(
                WatchAlert(code, name, "warn", f"跌 {p:+.2f}%（≤{pct_down}%）", "warn")
            )
        if s is not None and s <= score_low:
            alerts.append(
                WatchAlert(code, name, "warn", f"评分 {s:.1f} 偏低（≤{score_low}）", "warn")
            )
        elif s is not None and s >= score_high:
            alerts.append(
                WatchAlert(code, name, "info", f"评分 {s:.1f} 偏高（≥{score_high}）", "info")
            )
    order = {"hot": 0, "warn": 1, "info": 2}
    alerts.sort(key=lambda a: (order.get(a.level, 9), a.code))
    return alerts


def alerts_to_markdown(alerts: list[WatchAlert], *, title: str = "自选股提醒") -> str:
    if not alerts:
        return f"# {title}\n\n暂无触发项。\n"
    lines = [f"# {title}", "", f"共 {len(alerts)} 条", ""]
    for a in alerts:
        icon = {"hot": "🔥", "warn": "⚠️", "info": "ℹ️"}.get(a.level, "•")
        lines.append(f"- {icon} **{a.name}（{a.code}）** — {a.message}")
    lines.append("")
    return "\n".join(lines)
