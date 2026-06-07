"""侧边栏：推荐使用路径。"""

from __future__ import annotations

import streamlit as st

from src.ui.changelog_panel import render_changelog_panel
from src.ui.capability_map import render_capability_map_sidebar
from src.ui.playbook_preview import render_playbook_preview_sidebar
from src.ui.health_panel import render_health_panel
from src.ui.push_panel import render_push_panel
from src.ui.readonly_export_panel import render_readonly_export_panel
from src.ui.share_panel import render_share_panel
from src.ui.theme_style import render_theme_toggle
from src.util.i18n_strings import render_locale_toggle
from src.ui.milestone_banner import EVOLUTION_100_PATH
from src.util.readonly_mode import is_readonly_mode
from src.storage.history_store import mark_dirty
from src.util.sidebar_state import (
    is_section_collapsed,
    normalize_sidebar_collapsed,
    set_section_collapsed,
)

_PHASE_OPTIONS = [
    "P1 结构+可读资料", "P2 页面模块化", "P3 一键分析", "P4 公网协作", "P5 智能持久化",
    "P6 体验极限", "P7 智能增强", "P8 生态扩展", "P9 运维观测", "P10 导出增强",
    "P11 文档版本", "P12 百步进化", "P13 智能提醒", "P14 运维脚本", "P15 体验抛光",
    "P16 双股对比", "P17 提醒推送", "P18 体验与v2", "P19 自选分组", "P20 历史趋势",
    "P21 备份导入", "P22 快捷筛选", "P23 定时摘要", "P24 体验抛光",
    "P25 板块热力图", "P26 批量操作", "P27 文档与v2.3",
    "P28 笔记标注", "P29 性能缓存", "P30 文档与v2.4",
    "P31 笔记导出", "P32 健康面板", "P33 文档与v2.5",
    "P34 搜索历史", "P35 提醒模板", "P36 文档与v2.6",
    "P37 工作台仪表盘", "P38 只读分享", "P39 文档与v2.7",
    "P40 多语言文案", "P41 快捷键提示", "P42 文档与v2.8",
    "P43 自选排序", "P44 分析周报", "P45 文档与v2.9",
    "P46 价格目标", "P47 新鲜度徽章", "P48 文档与v3.0",
    "P49 组合权重", "P50 周报cron", "P51 文档与v3.1",
    "P52 相似股推荐", "P53 会话欢迎", "P54 文档与v3.2",
    "P55 分析置顶", "P56 失败重试", "P57 文档与v3.3",
    "P58 快捷加自选", "P59 邮件主题", "P60 文档与v3.4",
    "P61 600步庆祝", "P62 失败汇总", "P63 文档与v3.5",
    "P64 CSV导入", "P65 静默时段", "P66 文档与v3.6",
    "P67 CSV导出", "P68 最近查看", "P69 文档与v3.7",
    "P70 涨跌贡献", "P71 侧边栏折叠", "P72 文档与v3.8",
    "P73 相对板块", "P74 机构一页纸", "P75 文档与v3.9",
    "P76 板块龙头", "P77 一页纸推送", "P78 文档与v4.0",
    "P79 风险雷达", "P80 作战清单", "P81 文档与v4.1",
    "P82 作战cron", "P83 风险推送", "P84 文档与v4.2",
    "P85 作战优先级", "P86 合并导出", "P87 文档与v4.3",
    "P88 优先级推送", "P89 首页入口", "P90 文档与v4.4",
    "P91 900步庆祝", "P92 一键全开推送", "P93 文档与v4.5",
    "P94 能力地图跳转", "P95 公开数据手册", "P96 文档与v4.6",
    "P97 手册内置预览", "P98 千步预热", "P99 文档与v5.0",
]


def render_workflow_sidebar() -> None:
    with st.sidebar:
        collapsed_prefs = normalize_sidebar_collapsed(st.session_state.get("sidebar_collapsed"))
        workflow_collapsed = is_section_collapsed(collapsed_prefs, "workflow_phase")
        capability_collapsed = is_section_collapsed(collapsed_prefs, "capability_map")
        fold_pref = st.checkbox(
            "折叠快速上手",
            value=workflow_collapsed,
            key="sidebar_workflow_fold_pref",
        )
        if fold_pref != workflow_collapsed:
            st.session_state.sidebar_collapsed = set_section_collapsed(
                collapsed_prefs, "workflow_phase", fold_pref
            )
            mark_dirty()

        with st.expander("快速上手", expanded=not fold_pref):
            st.markdown(
                f"""
**① 发现**  
「② 搜索添加」或「④ 全球股市」找标的 → 加入工作台

**② 分析**  
「① 分析工作台」→ **一键分析** 或 K 线 / 财务 / 板块

**③ 导出**  
一键分析后下载 `.md` 简报，或点「生成可读简报」

---
*进化路线见仓库 `EVOLUTION.md`*  
*百步功能清单：[docs/EVOLUTION_100.md]({EVOLUTION_100_PATH})*
                """
            )
            phase = st.selectbox(
                "当前进化阶段",
                _PHASE_OPTIONS,
                index=98,
                disabled=True,
            )
            st.caption(phase)

        cap_fold_pref = st.checkbox(
            "折叠能力地图",
            value=capability_collapsed,
            key="sidebar_capability_fold_pref",
        )
        if cap_fold_pref != capability_collapsed:
            st.session_state.sidebar_collapsed = set_section_collapsed(
                collapsed_prefs, "capability_map", cap_fold_pref
            )
            mark_dirty()

        render_capability_map_sidebar(expanded=not cap_fold_pref)

        playbook_collapsed = is_section_collapsed(collapsed_prefs, "playbook_preview")
        pb_fold_pref = st.checkbox(
            "折叠作战手册预览",
            value=playbook_collapsed,
            key="sidebar_playbook_fold_pref",
        )
        if pb_fold_pref != playbook_collapsed:
            st.session_state.sidebar_collapsed = set_section_collapsed(
                collapsed_prefs, "playbook_preview", pb_fold_pref
            )
            mark_dirty()

        render_playbook_preview_sidebar(expanded=not pb_fold_pref)

        render_theme_toggle()
        render_locale_toggle()
        render_share_panel()
        if not is_readonly_mode():
            render_push_panel()
        render_readonly_export_panel()
        render_health_panel()
        render_changelog_panel()
