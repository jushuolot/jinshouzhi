"""Stock Assistant — 入口：登录、路由、持久化。"""

from __future__ import annotations

import streamlit as st

from src.storage.history_store import load_into_session, persist_session
from src.ui import app_core as C
from src.ui.pages import history, insight, movers, panorama, plates, search, watch
from src.ui.workflow_sidebar import render_workflow_sidebar
from src.ui.onboarding import render_onboarding_banner
from src.util.query_time import format_query_datetime

st.set_page_config(page_title="Stock Assistant", layout="wide")
C._login_gate()
C._init_state()
load_into_session()
C._apply_pending_session_keys()
render_workflow_sidebar()

st.title("Stock Assistant · 快速分析")
st.caption(
    "三步：**发现标的 → 工作台分析 → 导出可读简报**。数据来自东财 / Yahoo 等公开源（规则推演，非投资建议）。"
)
render_onboarding_banner()
if st.session_state.get("query_at_latest"):
    st.info(f"📅 最近查询时间：{format_query_datetime(st.session_state['query_at_latest'])}")

(
    tab_watch,
    tab_search,
    tab_plates,
    tab_movers,
    tab_panorama,
    tab_insight,
    tab_history,
) = st.tabs(
    [
        "① 分析工作台",
        "② 搜索添加",
        "③ 板块行情",
        "④ 全球股市",
        "⑤ 异动全景",
        "⑥ 行动路线",
        "⑦ 历史记录",
    ]
)

with tab_search:
    search.render()
with tab_watch:
    watch.render()
with tab_plates:
    plates.render()
with tab_movers:
    movers.render()
with tab_panorama:
    panorama.render()
with tab_insight:
    insight.render()
with tab_history:
    history.render()

if st.session_state.get("_history_dirty"):
    persist_session()
