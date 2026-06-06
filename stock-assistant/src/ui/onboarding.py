"""新手引导与空状态提示（P5）。"""

from __future__ import annotations

import streamlit as st


def render_onboarding_banner() -> None:
    wl = st.session_state.get("watchlist") or []
    snaps = st.session_state.get("watch_snapshots") or {}

    if not wl:
        st.info(
            "👋 **第一次用？** 三步即可：\n\n"
            "1. 打开上方 **② 搜索添加**，输入「茅台」或股票代码 → **全球搜索** → **加入自选股**\n"
            "2. 回到 **① 分析工作台** → **刷新全部摘要** 或 **⚡ 一键分析**\n"
            "3. 下载 `.md` 简报，或左侧 **📤 分享给同事**（公网需先部署）"
        )
        return

    if not snaps:
        st.warning(
            "💡 自选股已有 **{}** 只，尚未生成摘要。请进入 **① 分析工作台** → "
            "点 **刷新全部摘要**（快速）或选中一只后 **⚡ 一键分析**（完整简报）。".format(len(wl))
        )
        return

    stale = sum(1 for x in wl if str(x.get("代码") or "") not in snaps)
    if stale > 0:
        st.caption(f"ℹ️ 有 {stale} 只自选股尚无摘要，可在工作台 **刷新全部摘要** 补齐。")
