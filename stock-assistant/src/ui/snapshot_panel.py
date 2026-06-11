"""全市场快照对比面板（P126）。"""

from __future__ import annotations

from typing import Any

import pandas as pd
import streamlit as st

from src.analysis.market_snapshot import DIFF_JSON, WEEKLY_JSON
from src.util.cloud_picks_loader import load_cloud_picks


def _load_diff() -> dict[str, Any] | None:
    cloud = load_cloud_picks()
    if cloud and cloud.get("snapshot_diff"):
        return cloud["snapshot_diff"]
    if DIFF_JSON.is_file():
        try:
            import json

            return json.loads(DIFF_JSON.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def _load_weekly() -> dict[str, Any] | None:
    cloud = load_cloud_picks()
    if cloud and cloud.get("weekly_summary"):
        return cloud["weekly_summary"]
    if WEEKLY_JSON.is_file():
        try:
            import json

            return json.loads(WEEKLY_JSON.read_text(encoding="utf-8"))
        except Exception:
            pass
    return None


def render_snapshot_panel() -> None:
    st.markdown("### 📸 全市场快照对比")
    st.caption("每晚轻量快照 ~150 只（三榜合并，无 K 线）；次日对比异动，再精选跑深度模型。")

    weekly = _load_weekly()
    if weekly:
        st.info(f"**周汇总：** {weekly.get('headline') or '—'}")
        rate = weekly.get("week_hit_rate_pct")
        if rate is not None:
            st.caption(f"本周快照验证命中率 **{rate:.0f}%**（{weekly.get('week_checks')} 次）")

    diff = _load_diff()
    if not diff:
        st.caption("尚无两日快照对比；第二个交易日收盘后会自动生成。")
        return

    c1, c2, c3 = st.columns(3)
    c1.metric("对比样本", str(diff.get("compared") or 0))
    avg = diff.get("avg_pct_delta")
    c2.metric("均涨跌变化", f"{avg:+.2f}%" if avg is not None else "—")
    c3.metric("快照日", f"{diff.get('prev_date')}→{diff.get('curr_date')}")

    for line in diff.get("conclusions") or []:
        st.caption(f"· {line}")

    checks = diff.get("pick_checks") or []
    if checks:
        st.markdown("**昨日预测 vs 今日快照**")
        st.dataframe(pd.DataFrame(checks), use_container_width=True, hide_index=True)

    movers = diff.get("movers") or []
    if movers:
        st.markdown("**异动前列（精选深度分析来源）**")
        st.dataframe(pd.DataFrame(movers[:8]), use_container_width=True, hide_index=True)
