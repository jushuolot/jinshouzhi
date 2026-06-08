"""私人选股花园 — 单页极简 UI（P103）。"""

from __future__ import annotations

from datetime import date

import pandas as pd
import streamlit as st

from src.analysis.daily_picks import (
    SIGNAL_BUY,
    SIGNAL_WATCH,
    fetch_and_rank_a_picks,
    picks_to_markdown,
)
from src.analysis.pick_tracker import (
    append_today_picks,
    hit_rate_summary,
    records_for_display,
    verify_log,
)
from src.providers import market_data
from src.storage.history_store import mark_dirty
from src.ui import app_core as C
from src.util.app_meta import APP_VERSION, EVOLUTION_STEP
from src.util.cloud_picks_loader import load_cloud_picks
from src.util.cloud_runtime import cloud_mode_label, is_streamlit_cloud
from src.util.readonly_mode import is_readonly_mode


def _signal_emoji(signal: str) -> str:
    if signal == SIGNAL_BUY:
        return "🟢 买入"
    if signal == SIGNAL_WATCH:
        return "🟡 观望"
    return "⚪ 回避"


def _fetch_ranking() -> tuple[pd.DataFrame, str]:
    return market_data.fetch_a_ranking_multi(board="涨幅榜", limit=60)


def _pct_map_from_ranking(df: pd.DataFrame) -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    if df is None or df.empty:
        return out
    for _, row in df.iterrows():
        code = str(row.get("代码") or "").replace(".0", "").strip()
        try:
            out[code] = float(row.get("涨跌幅%"))
        except (TypeError, ValueError):
            out[code] = None
    return out


def render() -> None:
    st.markdown("## 🌱 私人选股花园")
    st.caption(
        f"只有你知道密码 · {cloud_mode_label()} · "
        f"v{APP_VERSION} · 已进化 {EVOLUTION_STEP} 步"
    )
    if is_streamlit_cloud():
        st.success("☁️ **公网云端模式**：扫盘算力在 Streamlit 服务器，你的电脑只负责看。")
    else:
        st.caption("💡 不想占本地配置？请看 [零本地公网指南](docs/CLOUD_ONLY.md) 部署 Streamlit Cloud。")

    cloud = load_cloud_picks()
    if cloud and cloud.get("picks") and not st.session_state.get("today_picks"):
        st.session_state.today_picks = list(cloud["picks"])
        st.session_state.last_pick_at = str(cloud.get("generated_at") or "")[:10]
        st.session_state["last_pick_source"] = f"GitHub 云端 · {cloud.get('source', '')}"
        st.info(
            f"🌙 **云端已扫盘**（{st.session_state.last_pick_at}）— "
            f"GitHub 每晚自动运行，打开即可看。也可手动点刷新更新。"
        )

    st.info(
        "**就一件事：** 点下面大按钮，我会从全网 A 股涨幅榜里筛出今天值得关注的（最多 5 只）。"
        "基金可先搜 **ETF 代码**（如 510300）加入自选；股票为主、基金为辅。"
    )

    readonly = is_readonly_mode()
    pick_log: list = list(st.session_state.get("pick_log") or [])
    today_picks: list = list(st.session_state.get("today_picks") or [])
    scan_stats = dict(st.session_state.get("last_pick_scan") or {})

    col_a, col_b = st.columns([2, 1])
    with col_a:
        if readonly:
            st.caption("只读模式：不可刷新推荐。")
        elif st.button("🔮 刷新今日 A 股推荐", type="primary", use_container_width=True):
            with st.spinner("正在扫描 A 股涨幅榜并评分（约 20–60 秒）…"):
                picks, src, stats = fetch_and_rank_a_picks(
                    _fetch_ranking,
                    C._fetch_one,
                    max_picks=5,
                )
                st.session_state.today_picks = [p.as_dict() for p in picks]
                st.session_state.last_pick_scan = stats
                st.session_state["last_pick_source"] = src
                st.session_state["last_pick_at"] = date.today().isoformat()
                pick_log = append_today_picks(pick_log, picks)
                st.session_state.pick_log = pick_log
                mark_dirty()
                C._stamp_query("garden")
                C._save_history(log_kind="insight", log_label=f"花园推荐 {len(picks)} 只")
            st.rerun()
    with col_b:
        if scan_stats:
            st.metric("本次扫描", f"{scan_stats.get('scanned', 0)} 只")

    if st.session_state.get("last_pick_at"):
        st.caption(
            f"最近刷新：{st.session_state['last_pick_at']} · "
            f"数据源：{st.session_state.get('last_pick_source', '东财')}"
        )

    # 核对历史推荐（轻量，可手动触发）
    if not readonly and st.button("📊 核对推荐成绩单", use_container_width=False):
        with st.spinner("拉取最新涨跌核对历史推荐…"):
            try:
                rank_df, _ = _fetch_ranking()
                pct_map = _pct_map_from_ranking(rank_df)
                pick_log = verify_log(pick_log, pct_map)
                st.session_state.pick_log = pick_log
                mark_dirty()
                st.success("成绩单已更新。")
            except Exception as e:
                st.warning(f"核对失败：{e}")
        st.rerun()

    summary = hit_rate_summary(pick_log)
    if summary.get("total_verified"):
        rate = summary.get("rate_pct")
        st.success(
            f"📊 **推荐成绩单** — {summary['label']}"
            + (f" · 命中率 **{rate:.0f}%**" if rate is not None else "")
        )
    else:
        st.caption("📊 推荐成绩单：多刷新几次、过几天再来看「涨过没有」。")

    today_picks = st.session_state.get("today_picks") or []
    if not today_picks:
        st.warning("还没有今日推荐。点 **「刷新今日 A 股推荐」** 开始。")
    else:
        st.markdown("### 今日可关注")
        rows = []
        for p in today_picks:
            rows.append(
                {
                    "信号": _signal_emoji(str(p.get("signal") or "")),
                    "名称": p.get("name"),
                    "代码": p.get("code"),
                    "评分": f"{float(p['score']):.1f}" if p.get("score") is not None else "—",
                    "今日涨跌%": f"{float(p['pct']):+.2f}" if p.get("pct") is not None else "—",
                    "建议持有": p.get("hold_days") or "—",
                    "一句话": (p.get("reason") or "")[:80],
                }
            )
        st.dataframe(pd.DataFrame(rows), use_container_width=True, hide_index=True)

        from src.analysis.daily_picks import DailyPick

        pick_objs = [
            DailyPick(
                code=str(p.get("code") or ""),
                name=str(p.get("name") or ""),
                score=p.get("score"),
                pct=p.get("pct"),
                signal=str(p.get("signal") or ""),
                hold_days=str(p.get("hold_days") or ""),
                reason=str(p.get("reason") or ""),
                price=p.get("price"),
            )
            for p in today_picks
        ]
        md = picks_to_markdown(pick_objs, day=st.session_state.get("last_pick_at"))
        st.download_button(
            "📥 下载今日推荐 (.md)",
            data=md.encode("utf-8"),
            file_name=f"A股推荐_{date.today().isoformat()}.md",
            mime="text/markdown",
            use_container_width=True,
        )

        buy_n = sum(1 for p in today_picks if p.get("signal") == SIGNAL_BUY)
        st.caption(
            f"🌙 **今晚检查清单：** {buy_n} 只「买入」信号 · "
            f"明天同一时间来点刷新，看推荐是否涨过 · 非投资建议"
        )

    hist = records_for_display(pick_log, limit=12)
    if hist:
        with st.expander("📜 最近推荐与验证", expanded=False):
            hrows = []
            for r in hist:
                status = "—"
                if r.verified:
                    status = "✅ 涨过" if r.hit else "❌ 未涨过"
                hrows.append(
                    {
                        "日期": r.pick_date,
                        "名称": r.name,
                        "代码": r.code,
                        "信号": r.signal,
                        "持有天": r.hold_days,
                        "结果": status,
                        "说明": r.note[:50] if r.note else "",
                    }
                )
            st.dataframe(pd.DataFrame(hrows), use_container_width=True, hide_index=True)

    with st.expander("🌙 成长日记（给「佛祖」每晚看一眼）", expanded=False):
        st.markdown(
            f"""
- **今日版本** v{APP_VERSION}，累计进化 **{EVOLUTION_STEP}** 步
- **扫描能力**：A 股涨幅榜 → 技术评分 → 买/观望信号
- **记忆**：推荐写入本地，到期自动核对涨没涨
- **隐私**：密码在 `.streamlit/secrets.toml`，别人打不开你的花园
- **免费扩容**：代码在 GitHub，Streamlit Cloud 免费部署，push 即升级

*像种子一样每天长一点 — 你休息，我在扫盘。*
            """
        )
