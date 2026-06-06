"""Stock Assistant — 入口：登录、路由、持久化。"""

from __future__ import annotations

import streamlit as st

from src.storage.history_store import load_into_session, persist_session
from src.ui import app_core as C
from src.ui.pages import history, insight, movers, panorama, plates, search, watch
from src.ui.tab_router import apply_tab_from_query, render_main_tabs
from src.util.i18n_strings import tab_label
from src.ui.workflow_sidebar import render_workflow_sidebar
from src.ui.mobile_style import inject_mobile_styles
from src.ui.theme_style import inject_theme_styles
from src.ui.onboarding import render_onboarding_banner
from src.ui.footer import render_app_footer
from src.util.query_time import format_query_datetime
from src.util.readonly_mode import apply_readonly_from_query, is_readonly_mode

st.set_page_config(page_title="Stock Assistant", layout="wide", initial_sidebar_state="auto")
C._login_gate()
C._init_state()
load_into_session()
apply_readonly_from_query()
C._apply_pending_session_keys()
inject_mobile_styles()
inject_theme_styles()
render_workflow_sidebar()

st.title("Stock Assistant · 快速分析")
st.caption(
    "三步：**发现标的 → 工作台分析 → 导出可读简报**。数据来自东财 / Yahoo 等公开源（规则推演，非投资建议）。"
)
render_onboarding_banner()
if is_readonly_mode():
    st.info("👁 **只读模式**：链接带 `?readonly=1`，已隐藏编辑与写入操作。")
_resolved_tab = apply_tab_from_query()
if _resolved_tab:
    _label = tab_label(_resolved_tab)
    st.caption(f"🔗 已根据链接打开：**{_label}**")
if st.session_state.get("query_at_latest"):
    st.info(f"📅 最近查询时间：{format_query_datetime(st.session_state['query_at_latest'])}")

render_main_tabs(
    {
        "watch": watch.render,
        "search": search.render,
        "plates": plates.render,
        "movers": movers.render,
        "panorama": panorama.render,
        "insight": insight.render,
        "history": history.render,
    }
)

if st.session_state.get("_history_dirty"):
    persist_session()

render_app_footer()
