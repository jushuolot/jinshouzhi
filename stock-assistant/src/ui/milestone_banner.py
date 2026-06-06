"""600 步庆祝横幅（P61）：会话内一次性 confetti 风格提示。"""

from __future__ import annotations

from typing import Any

import streamlit as st

from src.util.app_meta import EVOLUTION_STEP

MILESTONE_STEP = 600
SESSION_FLAG = "_milestone_600_banner_shown"
EVOLUTION_100_PATH = "docs/EVOLUTION_100.md"


def build_milestone_message(step: int = EVOLUTION_STEP) -> str:
    """庆祝文案：步数 + 百步清单链接。"""
    return (
        f"🎉🎊 **{step} 步进化达成！** "
        f"Stock Assistant 已完成 **{step}** 步持续迭代 · "
        f"完整功能清单见 [`docs/EVOLUTION_100.md`]({EVOLUTION_100_PATH})"
    )


def should_show_milestone(
    session_state: dict[str, Any],
    *,
    step: int = EVOLUTION_STEP,
    milestone: int = MILESTONE_STEP,
) -> bool:
    """step >= 600 且本会话尚未展示过庆祝条。"""
    if step < milestone:
        return False
    if session_state.get(SESSION_FLAG):
        return False
    return True


def render_milestone_banner() -> None:
    ss = dict(st.session_state)
    if not should_show_milestone(ss):
        return
    st.info(build_milestone_message())
    st.session_state[SESSION_FLAG] = True
