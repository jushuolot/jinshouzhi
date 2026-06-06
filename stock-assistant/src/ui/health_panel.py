"""数据源连通性探测（P5）。"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable

import streamlit as st


@dataclass(frozen=True)
class SourceHealth:
    name: str
    ok: bool
    detail: str


def _probe_eastmoney() -> SourceHealth:
    try:
        from src.providers import eastmoney

        hits = eastmoney.suggest("600519", limit=1)
        if hits:
            return SourceHealth("东财 A 股", True, "搜索正常")
        return SourceHealth("东财 A 股", False, "搜索无结果")
    except Exception as exc:
        return SourceHealth("东财 A 股", False, str(exc)[:60])


def _probe_yahoo() -> SourceHealth:
    try:
        from datetime import date, timedelta

        from src.providers import yahoo

        end = date.today()
        start = end - timedelta(days=10)
        df = yahoo.fetch_history("AAPL", start=start, end=end)
        if df is not None and not df.empty:
            return SourceHealth("Yahoo 港美", True, "AAPL 日线 ok")
        return SourceHealth("Yahoo 港美", False, "无数据")
    except Exception as exc:
        return SourceHealth("Yahoo 港美", False, str(exc)[:60])


@st.cache_data(ttl=120, show_spinner=False)
def probe_all_sources() -> tuple[dict[str, str], ...]:
    results = [_probe_eastmoney(), _probe_yahoo()]
    return tuple({"name": r.name, "ok": r.ok, "detail": r.detail} for r in results)


def render_health_panel(*, on_refresh: Callable[[], None] | None = None) -> None:
    with st.expander("🩺 数据源状态", expanded=False):
        if st.button("刷新检测", key="health_refresh", use_container_width=True):
            probe_all_sources.clear()
            if on_refresh:
                on_refresh()
            st.rerun()
        for row in probe_all_sources():
            icon = "🟢" if row["ok"] else "🔴"
            st.caption(f"{icon} **{row['name']}** — {row['detail']}")
        st.caption("检测缓存 2 分钟；行情延迟以各数据源为准。")
