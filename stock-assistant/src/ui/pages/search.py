from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.storage.history_store import mark_dirty
from src.ui import app_core as C
from src.ui.quick_actions import render_search_quick_actions
from src.providers import eastmoney, symbol_search, yahoo
from src.util.readonly_mode import is_readonly_mode
from src.util.search_history import normalize_search_history, push_search
from src.util.watchlist_add import add_hit_to_watchlist, effective_code, is_in_watchlist


def _run_global_search(keyword: str) -> None:
    kw = (keyword or "").strip()
    st.session_state.last_hits = symbol_search.suggest(kw, limit=40)
    if kw:
        st.session_state.search_history = push_search(
            st.session_state.get("search_history"),
            kw,
        )
        mark_dirty()
    C._stamp_query("search")


def render() -> None:
    st.subheader("全球证券搜索")
    st.caption("并行查询：A 股/北交所（东财）+ 港股/美股/英文名（Yahoo）。支持 XSHE:300755、SNX、synnex、茅台、0700.HK 等。")
    render_search_quick_actions()
    C._show_query_banner("search")

    st.session_state.setdefault("search_kw", "茅台")
    history = normalize_search_history(st.session_state.get("search_history"))
    if history:
        st.caption("最近搜索（点击重搜）")
        chip_cols = st.columns(min(len(history), 8))
        for i, term in enumerate(history[:8]):
            with chip_cols[i % len(chip_cols)]:
                if st.button(term, key=f"search_hist_{i}", use_container_width=True):
                    st.session_state.search_kw = term
                    with st.spinner("正在并行搜索 A 股 / 港股 / 美股…"):
                        _run_global_search(term)
                    st.rerun()

    kw = st.text_input(
        "关键词",
        key="search_kw",
        placeholder="中文名、代码、拼音、美股代码 SNX、公司英文名 synnex…",
    )
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("全球搜索", type="primary", use_container_width=True):
            with st.spinner("正在并行搜索 A 股 / 港股 / 美股…"):
                _run_global_search(kw)
    with col2:
        st.caption("每次同时查东财与 Yahoo，不是只搜 A 股。")

    hits: list[eastmoney.SearchHit] = st.session_state.last_hits or []
    if hits:
        cnt = symbol_search.count_by_kind(hits)
        st.success(
            f"共 {len(hits)} 条 · A股 {cnt['A']} · 港股 {cnt['HK']} · 美股 {cnt['US']}"
            + (f" · 其他 {cnt['OTHER']}" if cnt["OTHER"] else "")
        )
        readonly = is_readonly_mode()
        st.caption("搜索结果 · 每行可一键加入自选")
        wl = list(st.session_state.get("watchlist") or [])
        for i, h in enumerate(hits):
            code = effective_code(h)
            in_wl = is_in_watchlist(wl, code)
            row = st.columns([5, 1])
            with row[0]:
                st.markdown(C._hit_label(h))
            with row[1]:
                if readonly:
                    st.caption("只读")
                elif in_wl:
                    st.caption("已加入")
                elif st.button("加入自选", key=f"search_quick_add_{i}", use_container_width=True):
                    new_wl, added = add_hit_to_watchlist(st.session_state.watchlist, h)
                    if added:
                        st.session_state.watchlist = new_wl
                        mark_dirty()
                        C._save_history(log_kind="watchlist", log_label=f"加入自选股 {h.name}")
                        st.toast(f"已加入自选：{h.name}")
                        st.rerun()

        labels = [C._hit_label(h) for h in hits]
        idx = st.selectbox("选择证券查看详情", range(len(labels)), format_func=lambda i: labels[i])
        h = hits[int(idx)]
        if h.kind in ("US", "HK") and h.yahoo:
            try:
                prof = yahoo.fetch_profile(h.yahoo)
                st.write(
                    {
                        "名称": prof.name,
                        "代码": prof.ticker,
                        "交易所": prof.exchange,
                        "行业": prof.industry,
                        "板块": prof.sector,
                    }
                )
                if prof.long_business_summary:
                    st.caption(prof.long_business_summary[:500] + ("…" if len(prof.long_business_summary) > 500 else ""))
            except Exception as e:
                st.warning(f"简介拉取失败：{e}")
        else:
            st.write(eastmoney.fetch_company_profile_stub(h))
        if readonly:
            st.caption("只读模式：无法加入自选股。")
        elif is_in_watchlist(st.session_state.watchlist, effective_code(h)):
            st.caption("已在自选股中。")
        elif st.button("加入自选股", use_container_width=True):
            if C._add_to_watchlist(h):
                st.success("已加入自选股。")
    else:
        st.info("输入关键词后点「全球搜索」。纯英文公司名（如 synnex）请直接搜，会走 Yahoo。")
