"""侧边栏：推荐使用路径。"""

from __future__ import annotations

import streamlit as st

from src.ui.health_panel import render_health_panel
from src.ui.readonly_export_panel import render_readonly_export_panel
from src.ui.share_panel import render_share_panel


def render_workflow_sidebar() -> None:
    with st.sidebar:
        st.markdown("### 快速上手")
        st.markdown(
            """
**① 发现**  
「② 搜索添加」或「④ 全球股市」找标的 → 加入工作台

**② 分析**  
「① 分析工作台」→ **一键分析** 或 K 线 / 财务 / 板块

**③ 导出**  
一键分析后下载 `.md` 简报，或点「生成可读简报」

---
*进化路线见仓库 `EVOLUTION.md`*
            """
        )
        phase = st.selectbox(
            "当前进化阶段",
            ["P1 结构+可读资料", "P2 页面模块化", "P3 一键分析", "P4 公网协作", "P5 智能持久化", "P6 体验极限", "P7 智能增强"],
            index=6,
            disabled=True,
        )
        st.caption(phase)

        render_share_panel()
        render_readonly_export_panel()
        render_health_panel()
