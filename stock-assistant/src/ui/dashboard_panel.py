"""工作台仪表盘 UI（P37）。"""

from __future__ import annotations

from typing import Any

import streamlit as st

from src.analysis.dashboard_stats import DashboardStats, compute_dashboard_stats


def render_dashboard_panel(
    *,
    watchlist: list[dict[str, Any]],
    snapshots: dict[str, Any],
    pct_up: float,
    pct_down: float,
    score_low: float,
    score_high: float,
) -> DashboardStats:
    stats = compute_dashboard_stats(
        watchlist,
        snapshots,
        pct_up=pct_up,
        pct_down=pct_down,
        score_low=score_low,
        score_high=score_high,
    )
    if stats.watch_count <= 0:
        return stats

    st.markdown("#### 📊 工作台概览")
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.metric("自选", stats.watch_count, help="当前自选股数量")
    with c2:
        avg_label = f"{stats.avg_score:.1f}" if stats.avg_score is not None else "—"
        st.metric("均分", avg_label, help=f"有评分 {stats.scored_count} 只")
    with c3:
        st.metric("上涨", stats.up_count, delta=None, help="涨跌幅 > 0")
    with c4:
        st.metric("下跌", stats.down_count, delta=None, help="涨跌幅 < 0")
    with c5:
        st.metric("今日提醒", stats.alert_count, help="按当前阈值计算的触发项")
    if stats.snapshot_count < stats.watch_count:
        missing = stats.watch_count - stats.snapshot_count
        st.caption(f"摘要覆盖 {stats.snapshot_count}/{stats.watch_count} 只；{missing} 只尚无快照。")
    elif stats.flat_count:
        st.caption(f"平盘/无涨跌 {stats.flat_count} 只。")
    return stats
