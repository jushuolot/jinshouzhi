"""自选股今日速览 / 日报 Markdown（P5）。"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from src.util.query_time import format_query_datetime


def _pct_str(v: Any) -> str:
    if v is None:
        return "—"
    try:
        return f"{float(v):+.2f}%"
    except (TypeError, ValueError):
        return "—"


def build_watchlist_digest(
    watchlist: list[dict[str, Any]],
    snapshots: dict[str, Any],
    *,
    title: str = "自选股今日速览",
    query_label: str = "",
) -> str:
    now = query_label or format_query_datetime(datetime.now())
    lines: list[str] = [
        f"# {title}",
        "",
        f"> 生成时间：{now}　|　共 {len(watchlist)} 只",
        "",
        "| 名称 | 代码 | 涨跌幅 | 评分 | 一句话 |",
        "|------|------|--------|------|--------|",
    ]
    for item in watchlist:
        code = str(item.get("代码") or "")
        name = str(item.get("名称") or code)
        snap = snapshots.get(code) or {}
        pct = _pct_str(snap.get("pct"))
        score = snap.get("score")
        score_s = f"{float(score):.1f}" if score is not None else "—"
        one = str(snap.get("one_line") or "—").replace("|", "｜")[:80]
        fin = str(snap.get("fin_summary") or "").strip()
        lines.append(f"| {name} | {code} | {pct} | {score_s} | {one} |")
        if fin:
            lines.append(f"| ↳ 财务 | {code} | — | — | {fin.replace('|', '｜')[:100]} |")

    lines.extend(
        [
            "",
            "## 使用说明",
            "",
            "以上为规则型整理，基于公开行情，**非投资建议**。",
            "详细分析请在「① 分析工作台」对单只标的点击 **一键分析** 并下载完整简报。",
            "",
        ]
    )
    return "\n".join(lines)
