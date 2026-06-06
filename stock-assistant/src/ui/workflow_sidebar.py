"""侧边栏：推荐使用路径。"""

from __future__ import annotations

import streamlit as st

from src.ui.changelog_panel import render_changelog_panel
from src.ui.health_panel import render_health_panel
from src.ui.push_panel import render_push_panel
from src.ui.readonly_export_panel import render_readonly_export_panel
from src.ui.theme_style import render_theme_toggle


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
            [
                "P1 结构+可读资料", "P2 页面模块化", "P3 一键分析", "P4 公网协作", "P5 智能持久化",
                "P6 体验极限", "P7 智能增强", "P8 生态扩展", "P9 运维观测", "P10 导出增强",
                "P11 文档版本", "P12 百步进化", "P13 智能提醒", "P14 运维脚本", "P15 体验抛光",
                "P16 双股对比", "P17 提醒推送", "P18 体验与v2", "P19 自选分组", "P20 历史趋势",
                "P21 备份导入", "P22 快捷筛选", "P23 定时摘要", "P24 体验抛光",
            ],
            index=23,
            disabled=True,
        )
        st.caption(phase)

        render_theme_toggle()
        render_share_panel()
        render_push_panel()
        render_readonly_export_panel()
        render_health_panel()
        render_changelog_panel()
