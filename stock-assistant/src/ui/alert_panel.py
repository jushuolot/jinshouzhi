"""自选股阈值提醒 UI（P13）。"""

from __future__ import annotations

import streamlit as st

from src.analysis.watch_alerts import alerts_to_markdown, compute_watch_alerts
from src.storage.history_store import mark_dirty


def render_alert_panel(*, watchlist: list[dict], snapshots: dict) -> list:
    with st.expander("🔔 智能提醒（涨跌幅 / 评分）", expanded=False):
        st.session_state.setdefault("alert_pct_up", 5.0)
        st.session_state.setdefault("alert_pct_down", -5.0)
        st.session_state.setdefault("alert_score_low", 40.0)
        st.session_state.setdefault("alert_score_high", 65.0)
        c1, c2, c3, c4 = st.columns(4)
        with c1:
            st.number_input("涨幅≥%", key="alert_pct_up", step=0.5)
        with c2:
            st.number_input("跌幅≤%", key="alert_pct_down", step=0.5)
        with c3:
            st.number_input("低评分≤", key="alert_score_low", step=1.0)
        with c4:
            st.number_input("高评分≥", key="alert_score_high", step=1.0)
        alerts = compute_watch_alerts(
            watchlist,
            snapshots,
            pct_up=float(st.session_state.alert_pct_up),
            pct_down=float(st.session_state.alert_pct_down),
            score_low=float(st.session_state.alert_score_low),
            score_high=float(st.session_state.alert_score_high),
        )
        if not alerts:
            st.caption("当前无触发项；请先「刷新全部摘要」。")
        else:
            for a in alerts[:12]:
                icon = {"hot": "🔥", "warn": "⚠️", "info": "ℹ️"}.get(a.level, "•")
                st.markdown(f"{icon} **{a.name}（{a.code}）** — {a.message}")
            md = alerts_to_markdown(alerts)
            st.download_button(
                "下载提醒 (.md)",
                data=md.encode("utf-8"),
                file_name="自选股提醒.md",
                mime="text/markdown",
                key="alert_md_dl",
                use_container_width=True,
            )
        if st.button("保存提醒阈值", key="alert_save_prefs", use_container_width=True):
            mark_dirty()
            st.success("阈值已保存（随会话持久化）。")
    return alerts
