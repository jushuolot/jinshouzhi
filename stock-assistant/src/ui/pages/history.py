from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.ui import app_core as C

from src.storage.history_store import (
    KIND_LABELS,
    filter_query_log,
    format_log_option,
    get_snapshot_by_id,
    history_path,
    load_history,
    persist_session,
    restore_snapshot,
    unique_dates_from_log,
    unique_stocks_from_log,
)


def render() -> None:
    st.subheader("历史记录")
    st.caption(
        f"数据保存在本机 `data/{history_path().name}`，刷新或重新登录后会自动恢复最近一次分析。"
    )
    st.caption(f"文件路径：`{history_path()}`")
    log = st.session_state.get("query_log") or []
    if not log:
        st.info("暂无历史。完成榜单刷新、异动全景或异动溯源后会自动记录。")
    else:
        st.markdown("**快速检索**")
        f1, f2, f3, f4 = st.columns(4)
        dates = unique_dates_from_log(log)
        with f1:
            f_date = st.selectbox("日期", ["全部"] + dates, key="hist_filter_date")
        kinds = sorted({str(e.get("kind") or "") for e in log if e.get("kind")})
        with f2:
            f_kind = st.selectbox(
                "类型",
                ["全部"] + kinds,
                format_func=lambda k: "全部" if k == "全部" else KIND_LABELS.get(k, k),
                key="hist_filter_kind",
            )
        markets = sorted({str(e.get("market") or "") for e in log if e.get("market")})
        with f3:
            f_market = st.selectbox("市场", ["全部"] + markets, key="hist_filter_market")
        stock_opts = unique_stocks_from_log(log)
        with f4:
            f_stock_pick = st.selectbox(
                "股票（可选）",
                ["全部"] + stock_opts[:60],
                key="hist_filter_stock_pick",
            )
        f_stock_kw = st.text_input(
            "股票关键词（代码/名称，与上项可叠加）",
            placeholder="如 920161、英伟达、兆易",
            key="hist_filter_stock_kw",
        )
        stock_kw = f_stock_kw
        if f_stock_pick and f_stock_pick != "全部":
            stock_kw = f"{f_stock_pick} {stock_kw}".strip()

        filtered = filter_query_log(
            log,
            date_key=f_date,
            kind=f_kind,
            market=f_market,
            stock_kw=stock_kw,
        )
        st.caption(f"共 {len(log)} 条记录，筛选后 {len(filtered)} 条")

        if filtered:
            show_rows = [e for _, e in filtered]
            log_df = pd.DataFrame(show_rows)
            show_cols = [
                c
                for c in (
                    "at",
                    "kind",
                    "label",
                    "market",
                    "board",
                    "stocks",
                    "count",
                    "conclusions_summary",
                )
                if c in log_df.columns
            ]
            if "kind" in log_df.columns:
                log_df = log_df.copy()
                log_df["类型"] = log_df["kind"].map(lambda k: KIND_LABELS.get(str(k), k))
                if "类型" in show_cols or "kind" in show_cols:
                    show_cols = ["at", "类型", "label", "market", "stocks", "conclusions_summary"]
                    show_cols = [c for c in show_cols if c in log_df.columns]
            st.dataframe(log_df[show_cols], use_container_width=True, hide_index=True)

            sel = st.selectbox(
                "选择一条历史恢复",
                range(len(filtered)),
                format_func=lambda i: format_log_option(filtered[i][1]),
                key="hist_pick_restore",
            )
            entry = filtered[int(sel)][1]
        else:
            st.warning("没有符合筛选条件的记录，请放宽日期/类型/股票条件。")
            entry = None

        if entry:
            snap = get_snapshot_by_id(str(entry.get("id")))
            if snap:
                st.markdown("**该次分析结论摘要**")
                concl = snap.get("conclusions") or {}
                if concl.get("panorama_headline"):
                    st.write(f"全景龙头：{concl['panorama_headline']}")
                rep_d = concl.get("route_report")
                if rep_d:
                    st.write(f"异动溯源：{rep_d.get('title')} — {str(rep_d.get('result', ''))[:200]}")
                for row in (concl.get("industry_cluster") or [])[:5]:
                    st.caption(
                        f"· {row.get('行业')}：{str(row.get('基础市场预期', ''))[:80]} → {row.get('参考观察（人工判断）', '')}"
                    )
                for note in (concl.get("per_stock_notes") or [])[:5]:
                    st.caption(f"· {note.get('name')}：{note.get('macro_expectation', '')}")

                if st.button("恢复此记录", type="primary", key="history_restore"):
                    restore_snapshot(snap)
                    st.session_state.query_log = load_history().get("query_log", [])
                    st.session_state.history_snapshots = load_history().get("snapshots", [])
                    st.success("已恢复榜单、全景与溯源结论，请切换到对应标签页查看。")
                    st.rerun()
            else:
                st.warning("该条日志没有完整快照（可能为较早版本）。")

    if st.session_state.get("history_restored_label"):
        st.info(f"已从历史恢复：{st.session_state.history_restored_label}")

    concl_live = st.session_state.get("history_conclusions") or {}
    if concl_live and st.session_state.get("_history_restored"):
        with st.expander("当前会话中的已恢复结论", expanded=False):
            if concl_live.get("route_report"):
                rd = concl_live["route_report"]
                st.markdown(f"**{rd.get('title')}**")
                st.write(rd.get("result"))
            if concl_live.get("per_stock_notes"):
                for n in concl_live["per_stock_notes"][:8]:
                    st.caption(f"{n.get('name')}（{n.get('code')}）· {n.get('industry')} · {n.get('macro_expectation', '')}")

