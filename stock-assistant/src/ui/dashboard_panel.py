"""工作台仪表盘 UI（P37）。"""

from __future__ import annotations

from typing import Any

import streamlit as st

from src.analysis.dashboard_stats import DashboardStats, compute_dashboard_stats
from src.util.i18n_strings import get_locale, t


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

    loc = get_locale()
    st.markdown(f"#### {t('dash_title', locale=loc)}")
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        st.metric(t("dash_watch", locale=loc), stats.watch_count, help=t("dash_help_watch", locale=loc))
    with c2:
        avg_label = f"{stats.avg_score:.1f}" if stats.avg_score is not None else "—"
        st.metric(
            t("dash_avg_score", locale=loc),
            avg_label,
            help=t("dash_help_avg", locale=loc, n=stats.scored_count),
        )
    with c3:
        st.metric(t("dash_up", locale=loc), stats.up_count, delta=None, help=t("dash_help_up", locale=loc))
    with c4:
        st.metric(t("dash_down", locale=loc), stats.down_count, delta=None, help=t("dash_help_down", locale=loc))
    with c5:
        st.metric(
            t("dash_alerts", locale=loc),
            stats.alert_count,
            help=t("dash_help_alerts", locale=loc),
        )
    if stats.snapshot_count < stats.watch_count:
        missing = stats.watch_count - stats.snapshot_count
        st.caption(
            t(
                "dash_missing_snap",
                locale=loc,
                have=stats.snapshot_count,
                total=stats.watch_count,
                missing=missing,
            )
        )
    elif stats.flat_count:
        st.caption(t("dash_flat", locale=loc, n=stats.flat_count))
    return stats
