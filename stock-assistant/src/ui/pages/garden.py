"""私人选股花园 — 单页极简 UI（P103）。"""

from __future__ import annotations

from datetime import date

import pandas as pd
import streamlit as st

from src.analysis.daily_picks import DailyPick, SIGNAL_BUY, SIGNAL_WATCH
from src.analysis.tomorrow_picks import (
    fetch_garden_picks_bundle,
    picks_to_markdown,
    tomorrow_trading_date,
)
from src.analysis.pick_tracker import (
    append_today_picks,
    hit_rate_summary,
    normalize_pick_log,
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
    if signal in (SIGNAL_BUY, "明日偏多"):
        return "🟢 明日偏多"
    if signal in (SIGNAL_WATCH, "明日观望"):
        return "🟡 明日观望"
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
    if cloud and cloud.get("generated_at"):
        cloud_day = str(cloud.get("generated_at") or "")[:10]
        if st.session_state.get("_cloud_picks_date") != cloud_day:
            st.session_state.today_picks = list(cloud.get("picks") or [])
            st.session_state.global_picks = list(cloud.get("global_picks") or [])
            st.session_state.last_pick_at = cloud_day
            st.session_state["last_pick_source"] = f"GitHub 云端 · {cloud.get('source', '')}"
            st.session_state["predict_for"] = (
                cloud.get("predict_for")
                or (cloud.get("stats") or {}).get("predict_for")
                or tomorrow_trading_date()
            )
            st.session_state["_cloud_picks_date"] = cloud_day
        ap = len(st.session_state.get("today_picks") or [])
        gp = len(st.session_state.get("global_picks") or [])
        if ap or gp:
            tgt = str(cloud.get("stats") or {}).get("predict_for") or tomorrow_trading_date()
            st.info(
                f"🌙 **云端已预测明日**（目标 **{tgt}**）— "
                f"A股 {ap} 只 · 全球 {gp} 只 · 基于今日收盘+历史K线。"
            )

    tgt_date = tomorrow_trading_date()
    st.info(
        f"**核心逻辑：** 不是今天涨最多的，而是用 **今日收盘 + 过去60日K线** "
        f"预测 **{tgt_date} 谁更可能继续走强**（趋势延续 / 强势回踩 / 突破在即）。"
        f" A股为主，港/美同步。"
    )

    readonly = is_readonly_mode()
    pick_log = normalize_pick_log(st.session_state.get("pick_log"))
    st.session_state.pick_log = pick_log
    today_picks: list = list(st.session_state.get("today_picks") or [])
    scan_stats = dict(st.session_state.get("last_pick_scan") or {})

    col_a, col_b = st.columns([2, 1])
    with col_a:
        if readonly:
            st.caption("只读模式：不可刷新推荐。")
        elif st.button("🔮 预测明日 A 股 + 全球", type="primary", use_container_width=True):
            with st.spinner("分析今日收盘与历史K线，预测明日偏强标的（约 1–3 分钟）…"):
                a_picks, global_picks, src, stats = fetch_garden_picks_bundle(
                    _fetch_ranking,
                    C._fetch_one,
                    max_a=5,
                    max_global_per_market=2,
                )
                st.session_state.today_picks = [p.as_dict() for p in a_picks]
                st.session_state.global_picks = [p.as_dict() for p in global_picks]
                st.session_state.last_pick_scan = stats
                st.session_state["last_pick_source"] = src
                st.session_state["last_pick_at"] = date.today().isoformat()
                st.session_state["predict_for"] = stats.get("predict_for") or tgt_date
                pick_log = append_today_picks(pick_log, a_picks)
                st.session_state.pick_log = pick_log
                mark_dirty()
                C._stamp_query("garden")
                C._save_history(
                    log_kind="insight",
                    log_label=f"明日预测 A{len(a_picks)} 全球{len(global_picks)}",
                )
            st.rerun()
    with col_b:
        if scan_stats:
            st.metric("本次扫描", f"{scan_stats.get('scanned', 0)} 只")

    predict_for = st.session_state.get("predict_for") or tomorrow_trading_date()
    if st.session_state.get("last_pick_at"):
        st.caption(
            f"分析日：{st.session_state['last_pick_at']} · 预测目标：**{predict_for}** · "
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
    global_picks = st.session_state.get("global_picks") or []

    def _pick_rows(items: list, *, show_market: bool = False) -> list[dict]:
        rows = []
        for p in items:
            row = {
                "信号": _signal_emoji(str(p.get("signal") or "")),
                "名称": p.get("name"),
                "代码": p.get("code"),
                    "明日分": f"{float(p['score']):.1f}" if p.get("score") is not None else "—",
                    "今日涨跌%": f"{float(p['pct']):+.2f}" if p.get("pct") is not None else "—",
                "建议持有": p.get("hold_days") or "—",
                "一句话": (p.get("reason") or "")[:80],
            }
            if show_market:
                row = {"市场": p.get("market") or "—", **row}
            rows.append(row)
        return rows

    if not today_picks and not global_picks:
        st.warning(f"还没有明日预测。收盘后点 **「预测明日 A 股 + 全球」**（目标 {predict_for}）。")
    else:
        if today_picks:
            st.markdown(f"### 🇨🇳 A股 · 明日偏强（{predict_for}）")
            st.dataframe(
                pd.DataFrame(_pick_rows(today_picks)),
                use_container_width=True,
                hide_index=True,
            )
        elif not today_picks:
            st.caption("🇨🇳 A股：暂无达标明日标的（可收盘后再试）。")

        if global_picks:
            st.markdown(f"### 🌍 全球 · 明日关注（{predict_for}）")
            st.dataframe(
                pd.DataFrame(_pick_rows(global_picks, show_market=True)),
                use_container_width=True,
                hide_index=True,
            )

        from src.analysis.daily_picks import DailyPick as _DailyPick

        def _to_pick(p: dict) -> _DailyPick:
            return _DailyPick(
                code=str(p.get("code") or ""),
                name=str(p.get("name") or ""),
                score=p.get("score"),
                pct=p.get("pct"),
                signal=str(p.get("signal") or ""),
                hold_days=str(p.get("hold_days") or ""),
                reason=str(p.get("reason") or ""),
                price=p.get("price"),
                market=str(p.get("market") or "A股"),
            )

        pick_objs = [_to_pick(p) for p in today_picks]
        global_objs = [_to_pick(p) for p in global_picks]
        md = picks_to_markdown(
            pick_objs,
            day=st.session_state.get("last_pick_at"),
            global_picks=global_objs,
            target_date=predict_for,
        )
        st.download_button(
            "📥 下载明日预测 (.md)",
            data=md.encode("utf-8"),
            file_name=f"明日推荐_{predict_for}.md",
            mime="text/markdown",
            use_container_width=True,
        )

        buy_n = sum(
            1
            for p in today_picks
            if p.get("signal") in (SIGNAL_BUY, "明日偏多")
        )
        st.caption(
            f"🌙 **佛祖查岗：** 预测 **{predict_for}** · A股 {buy_n} 只「明日偏多」· "
            f"全球 {len(global_picks)} 只 · 次日收盘后点「核对成绩单」看准不准 · 非投资建议"
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
- **扫描能力**：今日收盘 + 60日K线 → **明日偏强预测**（A股+港美）
- **记忆**：推荐写入本地，到期自动核对涨没涨
- **隐私**：密码在 `.streamlit/secrets.toml`，别人打不开你的花园
- **免费扩容**：代码在 GitHub，Streamlit Cloud 免费部署，push 即升级

*像种子一样每天长一点 — 你休息，我在扫盘。*
            """
        )
