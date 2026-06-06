from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.ui import app_core as C
from src.ui.quick_actions import render_search_quick_actions
from src.providers import eastmoney, symbol_search, yahoo


def render() -> None:
    st.subheader("全球证券搜索")
    st.caption("并行查询：A 股/北交所（东财）+ 港股/美股/英文名（Yahoo）。支持 XSHE:300755、SNX、synnex、茅台、0700.HK 等。")
    render_search_quick_actions()
    C._show_query_banner("search")
    kw = st.text_input("关键词", value="茅台", placeholder="中文名、代码、拼音、美股代码 SNX、公司英文名 synnex…")
    if "recent_searches" not in st.session_state:
        st.session_state.recent_searches = []
    if st.session_state.recent_searches:
        st.caption("最近搜索：" + " · ".join(st.session_state.recent_searches[:8]))
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("全球搜索", type="primary", use_container_width=True):
            with st.spinner("正在并行搜索 A 股 / 港股 / 美股…"):
                st.session_state.last_hits = symbol_search.suggest(kw, limit=40)
                q = (kw or "").strip()
                if q:
                    rs = [x for x in st.session_state.recent_searches if x != q]
                    st.session_state.recent_searches = ([q] + rs)[:12]
            C._stamp_query("search")
    with col2:
        st.caption("每次同时查东财与 Yahoo，不是只搜 A 股。")

    hits: list[eastmoney.SearchHit] = st.session_state.last_hits or []
    if hits:
        cnt = symbol_search.count_by_kind(hits)
        st.success(
            f"共 {len(hits)} 条 · A股 {cnt['A']} · 港股 {cnt['HK']} · 美股 {cnt['US']}"
            + (f" · 其他 {cnt['OTHER']}" if cnt["OTHER"] else "")
        )
        labels = [C._hit_label(h) for h in hits]
        idx = st.selectbox("选择证券", range(len(labels)), format_func=lambda i: labels[i])
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
        if st.button("加入自选股", use_container_width=True):
            C._add_to_watchlist(h)
            C._save_history(log_kind="watchlist", log_label=f"加入自选股 {h.name}")
            st.success("已加入自选股。")
    else:
        st.info("输入关键词后点「全球搜索」。纯英文公司名（如 synnex）请直接搜，会走 Yahoo。")

