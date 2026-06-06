"""页面底部版本信息。"""

from __future__ import annotations

import streamlit as st

from src.util.app_meta import APP_VERSION, BUILD_LABEL, EVOLUTION_STEP
from src.ui.keyboard_hints import render_keyboard_hints


def render_app_footer() -> None:
    st.divider()
    render_keyboard_hints()
    st.caption(
        f"Stock Assistant v{APP_VERSION} · {BUILD_LABEL} · "
        f"已进化 {EVOLUTION_STEP} 步 · 非投资建议"
    )
