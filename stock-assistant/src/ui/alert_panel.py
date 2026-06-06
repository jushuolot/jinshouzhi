"""自选股阈值提醒 UI（P13）+ Webhook 推送（P17）。"""

from __future__ import annotations

import streamlit as st

from src.analysis.watch_alerts import alerts_to_markdown, compute_watch_alerts
from src.notify.alert_push import maybe_push_alerts_if_configured, push_alerts_webhook
from src.notify.webhook import get_webhook_url
from src.storage.history_store import mark_dirty
from src.util.alert_profiles import ALERT_PROFILES, apply_alert_profile, profile_caption


def render_alert_panel(*, watchlist: list[dict], snapshots: dict) -> list:
    alerts: list = []
    with st.expander("🔔 智能提醒（涨跌幅 / 评分）", expanded=False):
        st.session_state.setdefault("alert_pct_up", 5.0)
        st.session_state.setdefault("alert_pct_down", -5.0)
        st.session_state.setdefault("alert_score_low", 40.0)
        st.session_state.setdefault("alert_score_high", 65.0)
        st.session_state.setdefault("push_webhook_on_alerts", False)
        st.caption("提醒模板（一键套用阈值）")
        prof_cols = st.columns(len(ALERT_PROFILES))
        for i, prof in enumerate(ALERT_PROFILES):
            with prof_cols[i]:
                if st.button(prof.label, key=f"alert_prof_{prof.id}", use_container_width=True):
                    apply_alert_profile(st.session_state, prof.id)
                    mark_dirty()
                    st.rerun()
        active_prof = next(
            (
                p
                for p in ALERT_PROFILES
                if float(st.session_state.alert_pct_up) == p.pct_up
                and float(st.session_state.alert_pct_down) == p.pct_down
                and float(st.session_state.alert_score_low) == p.score_low
                and float(st.session_state.alert_score_high) == p.score_high
            ),
            None,
        )
        if active_prof:
            st.caption(f"当前：{active_prof.label} · {profile_caption(active_prof)}")
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
        wh = get_webhook_url()
        if wh:
            st.checkbox("提醒触发时自动推送 Webhook", key="push_webhook_on_alerts")
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
            if wh:
                if st.button("推送到 Webhook", key="alert_push_webhook", use_container_width=True):
                    with st.spinner("推送提醒中…"):
                        ok, msg = push_alerts_webhook(alerts)
                    if ok:
                        st.success(f"Webhook: ✓ {msg}")
                    else:
                        st.warning(f"Webhook: ✗ {msg}")
            last = st.session_state.get("_last_alert_push_result")
            if last:
                st.caption(f"上次提醒推送：{last}")
        if st.button("保存提醒阈值", key="alert_save_prefs", use_container_width=True):
            mark_dirty()
            st.success("阈值已保存（随会话持久化）。")
    if alerts:
        maybe_push_alerts_if_configured(alerts)
    return alerts
