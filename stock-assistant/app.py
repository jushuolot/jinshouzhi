"""Stock Assistant — 入口：登录、路由、持久化。"""

from __future__ import annotations

import streamlit as st

from src.storage.history_store import load_into_session, persist_session
from src.ui import app_core as C
from src.ui.pages import history, insight, movers, panorama, plates, search, watch
from src.ui.tab_router import apply_tab_from_query, render_main_tabs
from src.util.watch_expander_nav import apply_watch_expand_from_query
from src.util.i18n_strings import tab_label
from src.ui.workflow_sidebar import render_workflow_sidebar
from src.ui.mobile_style import inject_mobile_styles
from src.ui.theme_style import inject_theme_styles
from src.ui.onboarding import render_onboarding_banner
from src.ui.welcome_banner import render_welcome_banner
from src.ui.milestone_banner import render_milestone_banner
from src.ui.v5_celebration_banner import render_v5_celebration_banner
from src.ui.simple_result import render_home_steps
from src.ui.priority_home import render_priority_home_entry
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

st.title("Stock Assistant · 股票快速看懂")
st.caption("不用懂术语：搜股票 → 看红绿结论框 → 下载简报发给同事。（公开数据推演，非投资建议）")
render_home_steps()
render_priority_home_entry()
render_welcome_banner()
render_milestone_banner()
render_v5_celebration_banner()
render_onboarding_banner()
if is_readonly_mode():
    st.info("👁 **只读模式**：链接带 `?readonly=1`，已隐藏编辑与写入操作。")
_resolved_tab = apply_tab_from_query()
_resolved_expand = apply_watch_expand_from_query(st.session_state, st.query_params)
if _resolved_tab:
    _label = tab_label(_resolved_tab)
    st.caption(f"🔗 已根据链接打开：**{_label}**")
if _resolved_expand:
    st.caption(f"📂 已展开工作台区块：**{_resolved_expand}**")
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
