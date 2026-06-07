"""公开数据能力地图（P91）：侧边栏列出关键分析能力。"""

from __future__ import annotations

import streamlit as st

from src.util.app_meta import EVOLUTION_STEP

CAPABILITY_ITEMS: list[tuple[str, str, str]] = [
    (
        "🏆 相对板块",
        "sector_relative",
        "自选内同板块均涨跌幅/均评分对比，工作台「相对板块」expander",
    ),
    (
        "📄 机构一页纸",
        "institutional_onepager",
        "结论/相对板块/风险/下一步 Markdown，可下载或 cron 推送",
    ),
    (
        "📋 作战清单",
        "battle_plan",
        "dashboard + alerts + Top 3 行动，历史页/工作台下载",
    ),
    (
        "🎯 优先关注",
        "priority_queue",
        "提醒/风险/板块综合排序 Top 5，首页与 digest 推送",
    ),
]

SECTION_KEY = "capability_map"


def capability_map_markdown(*, step: int = EVOLUTION_STEP) -> str:
    """能力地图 Markdown 正文。"""
    lines = [
        f"基于公开行情数据的规则型能力（进化 step **{step}**）：",
        "",
    ]
    for title, module, desc in CAPABILITY_ITEMS:
        lines.append(f"- **{title}** · `{module}` — {desc}")
    lines.extend(
        [
            "",
            "*以上均为整理型输出，非投资建议。*",
        ]
    )
    return "\n".join(lines)


def render_capability_map_sidebar(*, expanded: bool = False) -> None:
    """侧边栏「公开数据能力地图」expander。"""
    with st.expander("公开数据能力地图", expanded=expanded):
        st.markdown(capability_map_markdown())
