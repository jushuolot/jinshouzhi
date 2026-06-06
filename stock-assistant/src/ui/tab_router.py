"""主 Tab 路由与 ?tab= 深链接（P18）。"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any

import streamlit as st

TAB_ORDER: list[tuple[str, str]] = [
    ("watch", "① 分析工作台"),
    ("search", "② 搜索添加"),
    ("plates", "③ 板块行情"),
    ("movers", "④ 全球股市"),
    ("panorama", "⑤ 异动全景"),
    ("insight", "⑥ 行动路线"),
    ("history", "⑦ 历史记录"),
]

_TAB_IDS = {tid for tid, _ in TAB_ORDER}
_TAB_LABELS = [label for _, label in TAB_ORDER]
_TAB_ID_BY_LABEL = {label: tid for tid, label in TAB_ORDER}

_TAB_ALIASES: dict[str, str] = {
    "watch": "watch",
    "search": "search",
    "plates": "plates",
    "movers": "movers",
    "panorama": "panorama",
    "insight": "insight",
    "history": "history",
    "1": "watch",
    "2": "search",
    "3": "plates",
    "4": "movers",
    "5": "panorama",
    "6": "insight",
    "7": "history",
    "工作台": "watch",
    "分析工作台": "watch",
    "搜索": "search",
    "搜索添加": "search",
    "板块": "plates",
    "板块行情": "plates",
    "全球股市": "movers",
    "异动": "panorama",
    "异动全景": "panorama",
    "行动路线": "insight",
    "历史": "history",
    "历史记录": "history",
}
for tid, label in TAB_ORDER:
    _TAB_ALIASES[label] = tid


def resolve_tab_id(raw: str) -> str | None:
    key = (raw or "").strip()
    if not key:
        return None
    lower = key.lower()
    if lower in _TAB_ALIASES:
        return _TAB_ALIASES[lower]
    if key in _TAB_ALIASES:
        return _TAB_ALIASES[key]
    for tid, label in TAB_ORDER:
        if key in label or label in key:
            return tid
    return None


def apply_tab_from_query() -> str | None:
    """读取 ?tab= 并写入 session_state.active_tab。"""
    st.session_state.setdefault("active_tab", TAB_ORDER[0][0])
    raw = st.query_params.get("tab", "")
    if not raw:
        return None
    resolved = resolve_tab_id(str(raw))
    if resolved and resolved in _TAB_IDS:
        st.session_state.active_tab = resolved
        return resolved
    return None


def render_main_tabs(pages: dict[str, Callable[[], None]]) -> None:
    ids = [tid for tid, _ in TAB_ORDER]
    current = str(st.session_state.get("active_tab") or ids[0])
    if current not in ids:
        current = ids[0]
    idx = ids.index(current)

    selected_label = st.radio(
        "主导航",
        options=_TAB_LABELS,
        index=idx,
        horizontal=True,
        label_visibility="collapsed",
    )
    selected_id = _TAB_ID_BY_LABEL[selected_label]
    st.session_state.active_tab = selected_id

    render_fn = pages.get(selected_id)
    if render_fn:
        render_fn()
