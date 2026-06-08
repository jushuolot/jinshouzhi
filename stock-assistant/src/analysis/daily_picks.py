"""今日 A 股自动筛选（P103）：公开榜单 + 技术评分 → 买/观望信号。"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import date
from typing import Any, Callable

import pandas as pd

from src.analysis.quick_analyze import analyze_watch_light

FetchFn = Callable[..., tuple[pd.DataFrame, str]]

SIGNAL_BUY = "买入"
SIGNAL_WATCH = "观望"
SIGNAL_SKIP = "回避"


@dataclass(frozen=True)
class DailyPick:
    code: str
    name: str
    score: float | None
    pct: float | None
    signal: str
    hold_days: str
    reason: str
    price: float | None = None

    def as_dict(self) -> dict[str, Any]:
        return asdict(self)


def _row_to_item(row: pd.Series) -> dict[str, Any]:
    code = str(row.get("代码") or "").replace(".0", "").strip()
    market = str(row.get("市场") or "A")
    return {
        "代码": code,
        "名称": str(row.get("名称") or code),
        "类型": str(row.get("类型") or "A"),
        "市场": market,
        "货币": "CNY",
    }


def _signal_from(score: float | None, pct: float | None) -> tuple[str, str, str]:
    """返回 (信号, 持有建议, 理由片段)。"""
    name_st = ""
    if score is None:
        return SIGNAL_SKIP, "—", "暂无评分"
    if pct is not None and pct >= 9.5:
        return SIGNAL_SKIP, "1–2天", "涨幅过大，追高风险高"
    if pct is not None and pct <= -3:
        return SIGNAL_SKIP, "—", "弱势下跌，暂不介入"
    if score >= 68 and (pct is None or pct >= 0.5):
        return SIGNAL_BUY, "3–5天", "评分偏强且动能尚可"
    if score >= 55:
        return SIGNAL_WATCH, "2–3天", "评分中性偏上，可小仓观察"
    return SIGNAL_SKIP, "—", "评分偏弱"


def _is_st_name(name: str) -> bool:
    n = (name or "").upper()
    return "ST" in n or "*ST" in n


def rank_candidates_from_ranking(
    ranking_df: pd.DataFrame,
    *,
    fetch_fn: FetchFn | None = None,
    max_scan: int = 18,
    max_picks: int = 5,
) -> tuple[list[DailyPick], dict[str, Any]]:
    """
    从 A 股涨幅榜 DataFrame 筛出今日可关注标的。
    fetch_fn 提供时对前 max_scan 只做轻量 K 线评分；否则仅用榜单涨跌幅粗筛。
    """
    stats: dict[str, Any] = {"scanned": 0, "skipped_st": 0, "skipped_pct": 0, "errors": 0}
    if ranking_df is None or ranking_df.empty:
        return [], stats

    df = ranking_df.copy()
    if "涨跌幅%" in df.columns:
        df = df.sort_values("涨跌幅%", ascending=False)
    candidates: list[tuple[dict[str, Any], float | None]] = []
    for _, row in df.iterrows():
        if len(candidates) >= max_scan:
            break
        item = _row_to_item(row)
        code = item["代码"]
        name = item["名称"]
        if not code or len(code) != 6 or not code.isdigit():
            continue
        if _is_st_name(name):
            stats["skipped_st"] += 1
            continue
        try:
            pct = float(row.get("涨跌幅%"))
        except (TypeError, ValueError):
            pct = None
        if pct is not None and (pct < 0.3 or pct > 9.8):
            stats["skipped_pct"] += 1
            continue
        candidates.append((item, pct))

    picks: list[DailyPick] = []
    for item, list_pct in candidates:
        stats["scanned"] += 1
        score: float | None = None
        price: float | None = None
        one_line = ""
        try:
            if fetch_fn is not None:
                snap = analyze_watch_light(item, fetch_fn, days=60)
                score = snap.score
                price = snap.price
                one_line = snap.one_line
                if list_pct is None and snap.pct is not None:
                    list_pct = snap.pct
            else:
                try:
                    list_pct = float(list_pct) if list_pct is not None else None
                except (TypeError, ValueError):
                    list_pct = None
        except Exception:
            stats["errors"] += 1
            continue

        signal, hold, reason_bit = _signal_from(score, list_pct)
        if signal == SIGNAL_SKIP and score is not None and score < 50:
            continue
        reason = reason_bit
        if one_line and one_line not in ("—", "暂无评分。"):
            reason = f"{reason_bit}；{one_line[:60]}"
        try:
            price = price or float(item.get("最新价") or 0) or None
        except (TypeError, ValueError):
            pass

        picks.append(
            DailyPick(
                code=item["代码"],
                name=item["名称"],
                score=score,
                pct=list_pct,
                signal=signal,
                hold_days=hold,
                reason=reason,
                price=price,
            )
        )

    # 买入优先，其次观望，按评分降序
    order = {SIGNAL_BUY: 0, SIGNAL_WATCH: 1, SIGNAL_SKIP: 2}

    def sort_key(p: DailyPick) -> tuple:
        sc = p.score if p.score is not None else 0.0
        return (order.get(p.signal, 9), -sc)

    picks.sort(key=sort_key)
    buy_watch = [p for p in picks if p.signal in (SIGNAL_BUY, SIGNAL_WATCH)]
    return buy_watch[:max_picks], stats


def fetch_and_rank_a_picks(
    fetch_ranking: Callable[[], tuple[pd.DataFrame, str]],
    fetch_fn: FetchFn,
    *,
    max_picks: int = 5,
) -> tuple[list[DailyPick], str, dict[str, Any]]:
    """拉 A 股涨幅榜并评分筛选。"""
    df, src = fetch_ranking()
    picks, stats = rank_candidates_from_ranking(
        df,
        fetch_fn=fetch_fn,
        max_scan=20,
        max_picks=max_picks,
    )
    stats["source"] = src
    stats["board"] = "涨幅榜"
    stats["market"] = "A股"
    return picks, src, stats


def picks_to_markdown(picks: list[DailyPick], *, day: str | None = None) -> str:
    d = day or date.today().isoformat()
    lines = [f"# 今日 A 股推荐 · {d}", ""]
    if not picks:
        lines.append("暂无符合条件的推荐（可稍后重试刷新）。")
        return "\n".join(lines)
    lines.append("| 信号 | 名称 | 代码 | 评分 | 涨跌% | 持有 | 理由 |")
    lines.append("|------|------|------|------|-------|------|------|")
    for p in picks:
        sc = f"{p.score:.1f}" if p.score is not None else "—"
        pc = f"{p.pct:+.2f}" if p.pct is not None else "—"
        lines.append(
            f"| {p.signal} | {p.name} | {p.code} | {sc} | {pc} | {p.hold_days} | {p.reason[:40]} |"
        )
    lines.extend(["", "*公开数据自动筛选，非投资建议。*"])
    return "\n".join(lines)
