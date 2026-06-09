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
from src.analysis.market_outlook import (
    compute_market_outlook,
    enrich_picks_with_long_term,
    outlook_to_markdown,
)
from src.analysis.pick_tracker import (
    append_today_picks,
    has_due_verifications,
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
from src.util.buddha_nightly_brief import build_nightly_brief, brief_to_markdown
from src.util.buddha_ritual import build_ritual_meta, probe_a_market, ritual_banner_lines
from src.util.data_date_label import build_listing_caption, today_label_cn
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


def _render_market_outlook(readonly: bool, fetch_ranking) -> None:
    """大盘 1~2 周大跌概率 + 长线展望。"""
    st.markdown("### 📉 大盘长线风向标")
    st.caption("基于上证/创业板/恒指/标普 + A股涨跌广度，估计 **未来 1~2 周大跌概率**（非精确预测）。")

    outlook = st.session_state.get("market_outlook")
    outlook_day = (outlook or {}).get("as_of") if isinstance(outlook, dict) else None
    today_s = date.today().isoformat()

    cloud = load_cloud_picks()
    if cloud and cloud.get("market_outlook") and outlook_day != today_s:
        st.session_state.market_outlook = cloud["market_outlook"]
        outlook = cloud["market_outlook"]
        outlook_day = outlook.get("as_of")

    col_o1, col_o2 = st.columns([2, 1])
    with col_o1:
        if not readonly and st.button("🔄 刷新大盘长线分析", use_container_width=False):
            with st.spinner("拉取指数K线与市场广度…"):
                mo = compute_market_outlook(fetch_ranking=fetch_ranking)
                st.session_state.market_outlook = mo.as_dict()
                mark_dirty()
            st.rerun()
    with col_o2:
        pass

    outlook = st.session_state.get("market_outlook")
    if not outlook:
        st.info("点 **「刷新大盘长线分析」** 查看未来 1~2 周大跌概率与 2~8 周趋势。")
        return

    prob = float(outlook.get("crash_prob_1_2w_pct") or 0)
    c1, c2, c3 = st.columns(3)
    c1.metric("1~2周大跌概率", f"{prob:.0f}%", outlook.get("crash_label") or "")
    c2.metric("2周看法", (outlook.get("outlook_2w") or "—")[:12])
    c3.metric("4~8周看法", (outlook.get("outlook_4_8w") or "—")[:12])

    if prob >= 55:
        st.error(outlook.get("advice") or "")
    elif prob >= 40:
        st.warning(outlook.get("advice") or "")
    else:
        st.success(outlook.get("advice") or "")

    drivers = outlook.get("drivers") or []
    if drivers:
        st.caption("依据：" + " · ".join(drivers[:5]))

    with st.expander("指数快照与下载", expanded=False):
        idx_rows = []
        for i in outlook.get("indices") or []:
            if not i.get("close"):
                continue
            idx_rows.append(
                {
                    "指数": i.get("name"),
                    "趋势": i.get("trend"),
                    "5日%": i.get("pct_5d"),
                    "20日%": i.get("pct_20d"),
                    "距20日高%": i.get("drawdown_20d_pct"),
                }
            )
        if idx_rows:
            st.dataframe(pd.DataFrame(idx_rows), use_container_width=True, hide_index=True)
        if outlook.get("breadth_adv_pct") is not None:
            st.caption(f"A股样本上涨占比：{outlook['breadth_adv_pct']:.0f}%")
        from src.analysis.market_outlook import MarketOutlook, IndexSnapshot

        mo_obj = MarketOutlook(
            as_of=str(outlook.get("as_of") or ""),
            crash_prob_1_2w_pct=prob,
            crash_label=str(outlook.get("crash_label") or ""),
            outlook_2w=str(outlook.get("outlook_2w") or ""),
            outlook_4_8w=str(outlook.get("outlook_4_8w") or ""),
            breadth_adv_pct=outlook.get("breadth_adv_pct"),
            indices=[IndexSnapshot(**{k: i.get(k) for k in (
                "ticker", "name", "region", "close", "pct_5d", "pct_20d",
                "drawdown_20d_pct", "above_ma20", "trend", "vol_ratio",
            )}) for i in (outlook.get("indices") or []) if i.get("close")],
            drivers=list(drivers),
            advice=str(outlook.get("advice") or ""),
        )
        st.download_button(
            "📥 下载大盘展望 (.md)",
            data=outlook_to_markdown(mo_obj).encode("utf-8"),
            file_name=f"大盘展望_{outlook.get('as_of', today_s)}.md",
            mime="text/markdown",
        )


def _sync_ritual_meta(*, a_picks: int, global_picks: int, predict_for: str) -> None:
    """扫描后写入佛祖金标准 ritual 元数据。"""
    try:
        probe = probe_a_market()
        st.session_state.ritual_meta = build_ritual_meta(
            probe,
            a_picks=a_picks,
            global_picks=global_picks,
            predict_for=predict_for,
        )
    except Exception as exc:
        st.session_state.ritual_meta = {
            "ritual_level": "red",
            "ritual_summary": f"自检失败：{exc}",
            "data_fresh": False,
            "a_picks": a_picks,
            "global_picks": global_picks,
            "predict_for": predict_for,
        }


def _render_nightly_brief(
    pick_log: list,
    *,
    today_picks: list,
    global_picks: list,
    predict_for: str,
) -> None:
    """佛祖每晚一页：结论 + 建议 + 可下载。"""
    brief = build_nightly_brief(
        ritual=st.session_state.get("ritual_meta"),
        predict_for=predict_for,
        a_picks=today_picks,
        global_picks=global_picks,
        outlook=st.session_state.get("market_outlook"),
        hit_summary=hit_rate_summary(pick_log),
        cloud_sync_at=st.session_state.get("_cloud_sync_at"),
    )
    st.session_state.nightly_brief = brief
    mood = str(brief.get("mood") or "yellow")
    body = "\n".join(f"- {ln}" for ln in brief.get("lines") or [])
    action = str(brief.get("action") or "")
    if mood == "green":
        st.success(f"**今晚查岗**\n\n{body}\n\n**建议：** {action}")
    elif mood == "red":
        st.error(f"**今晚查岗**\n\n{body}\n\n**建议：** {action}")
    else:
        st.warning(f"**今晚查岗**\n\n{body}\n\n**建议：** {action}")
    st.download_button(
        "📥 下载今晚查岗简报 (.md)",
        data=brief_to_markdown(brief).encode("utf-8"),
        file_name=f"佛祖查岗_{date.today().isoformat()}.md",
        mime="text/markdown",
        use_container_width=True,
    )


def _try_auto_verify_garden(*, pick_log: list, readonly: bool) -> list:
    """到期推荐每天自动核对一次。"""
    if readonly or not has_due_verifications(pick_log):
        return pick_log
    if st.session_state.get("_verify_auto_date") == date.today().isoformat():
        return pick_log
    st.session_state._verify_auto_date = date.today().isoformat()
    try:
        rank_df, _ = _fetch_ranking()
        pct_map = _pct_map_from_ranking(rank_df)
        pick_log = verify_log(pick_log, pct_map)
        st.session_state.pick_log = pick_log
        mark_dirty()
    except Exception:
        pass
    return pick_log


def _render_buddha_gold_banner() -> None:
    meta = st.session_state.get("ritual_meta")
    if not meta:
        cloud = load_cloud_picks()
        if cloud and cloud.get("ritual"):
            meta = cloud["ritual"]
            st.session_state.ritual_meta = meta
    line, level = ritual_banner_lines(meta)
    summary = (meta or {}).get("ritual_summary")
    suffix = f" — {summary}" if summary else ""
    if level == "green":
        st.success(line + suffix)
    elif level == "yellow":
        st.warning(line + suffix)
    else:
        st.error(line + suffix)


def _try_auto_fill_garden(
    *,
    readonly: bool,
    pick_log: list,
    tgt_date: str,
) -> list:
    """打开页面时若无推荐，自动跑一轮（每天最多一次）。"""
    if readonly:
        return pick_log
    if st.session_state.get("today_picks") or st.session_state.get("global_picks"):
        return pick_log
    if st.session_state.get("_auto_fill_date") == date.today().isoformat():
        return pick_log

    st.session_state._auto_fill_date = date.today().isoformat()
    with st.spinner("正在自动预测明日 A 股 + 全球（首次约 1–3 分钟）…"):
        try:
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
            pred = stats.get("predict_for") or tgt_date
            st.session_state["predict_for"] = pred
            _sync_ritual_meta(
                a_picks=len(a_picks),
                global_picks=len(global_picks),
                predict_for=pred,
            )
            if a_picks:
                pick_log = append_today_picks(pick_log, a_picks)
                st.session_state.pick_log = pick_log
            try:
                mo = compute_market_outlook(fetch_ranking=_fetch_ranking)
                st.session_state.market_outlook = mo.as_dict()
            except Exception:
                pass
            mark_dirty()
        except Exception as exc:
            st.session_state["_auto_fill_error"] = str(exc)[:200]
    st.rerun()
    return pick_log


def _try_auto_market_outlook(readonly: bool) -> None:
    if readonly or st.session_state.get("market_outlook"):
        return
    if st.session_state.get("_outlook_auto_date") == date.today().isoformat():
        return
    st.session_state._outlook_auto_date = date.today().isoformat()
    try:
        mo = compute_market_outlook(fetch_ranking=_fetch_ranking)
        st.session_state.market_outlook = mo.as_dict()
    except Exception:
        pass


def render() -> None:
    st.markdown("## 🌱 私人选股花园")
    _render_buddha_gold_banner()
    st.caption(
        f"只有你知道密码 · {cloud_mode_label()} · "
        f"v{APP_VERSION} · 已进化 {EVOLUTION_STEP} 步"
    )
    if is_streamlit_cloud():
        st.success(
            "☁️ **公网云端模式**：算力在 Streamlit 服务器；"
            "**每晚扫盘结果自动从 GitHub 拉取，不用你点 Reboot。**"
        )
    else:
        st.caption("💡 不想占本地配置？请看 [零本地公网指南](docs/CLOUD_ONLY.md) 部署 Streamlit Cloud。")

    cloud = load_cloud_picks()
    if cloud and cloud.get("generated_at"):
        cloud_day = str(cloud.get("generated_at") or "")[:10]
        cloud_ts = str(cloud.get("generated_at") or "")[:19].replace("T", " ")
        cloud_picks = list(cloud.get("picks") or [])
        cloud_global = list(cloud.get("global_picks") or [])
        st.session_state["_cloud_sync_at"] = cloud_ts
        if st.session_state.get("_cloud_picks_date") != cloud_day:
            if cloud_picks or cloud_global:
                st.session_state.today_picks = cloud_picks
                st.session_state.global_picks = cloud_global
                st.session_state.last_pick_at = cloud_day
                st.session_state["last_pick_source"] = f"GitHub 云端 · {cloud.get('source', '')}"
                st.session_state["predict_for"] = (
                    cloud.get("predict_for")
                    or (cloud.get("stats") or {}).get("predict_for")
                    or tomorrow_trading_date()
                )
                pl = normalize_pick_log(st.session_state.get("pick_log"))
                pl = append_today_picks(pl, cloud_picks, day=cloud_day)
                st.session_state.pick_log = pl
                mark_dirty()
            st.session_state["_cloud_picks_date"] = cloud_day
        if cloud.get("market_outlook"):
            st.session_state.market_outlook = cloud["market_outlook"]
        if cloud.get("ritual"):
            st.session_state.ritual_meta = cloud["ritual"]
        ap = len(st.session_state.get("today_picks") or [])
        gp = len(st.session_state.get("global_picks") or [])
        if ap or gp:
            tgt = (cloud.get("stats") or {}).get("predict_for") or tomorrow_trading_date()
            st.info(
                f"🌙 **云端已预测明日**（目标 **{tgt}**）— "
                f"A股 {ap} 只 · 全球 {gp} 只 · 基于今日收盘+历史K线。"
            )
        elif cloud_picks is not None and not cloud_picks and not cloud_global:
            st.caption("☁️ 云端上次扫盘暂无标的，正在为你自动重试…")

    readonly = is_readonly_mode()
    tgt_date = tomorrow_trading_date()
    _try_auto_market_outlook(readonly)

    pick_log = normalize_pick_log(st.session_state.get("pick_log"))
    st.session_state.pick_log = pick_log
    pick_log = _try_auto_verify_garden(pick_log=pick_log, readonly=readonly)
    pick_log = _try_auto_fill_garden(readonly=readonly, pick_log=pick_log, tgt_date=tgt_date)
    today_picks: list = list(st.session_state.get("today_picks") or [])
    global_picks_early: list = list(st.session_state.get("global_picks") or [])
    predict_for_early = st.session_state.get("predict_for") or tomorrow_trading_date()
    _render_nightly_brief(
        pick_log,
        today_picks=today_picks,
        global_picks=global_picks_early,
        predict_for=predict_for_early,
    )
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
                st.session_state.today_picks = enrich_picks_with_long_term(
                    [p.as_dict() for p in a_picks],
                    C._fetch_one,
                )
                st.session_state.global_picks = [p.as_dict() for p in global_picks]
                mo = compute_market_outlook(fetch_ranking=_fetch_ranking)
                st.session_state.market_outlook = mo.as_dict()
                st.session_state.last_pick_scan = stats
                st.session_state["last_pick_source"] = src
                st.session_state["last_pick_at"] = date.today().isoformat()
                pred = stats.get("predict_for") or tgt_date
                st.session_state["predict_for"] = pred
                _sync_ritual_meta(
                    a_picks=len(a_picks),
                    global_picks=len(global_picks),
                    predict_for=pred,
                )
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
            build_listing_caption(
                data_day=str(st.session_state["last_pick_at"]),
                query_day=date.today().isoformat(),
                extra=f"预测交易日 **{predict_for}** · {st.session_state.get('last_pick_source', '东财')}",
            )
        )
    else:
        st.caption(f"📅 今天：**{today_label_cn()}**")

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

    today_picks = st.session_state.get("today_picks") or []
    global_picks = st.session_state.get("global_picks") or []

    def _pick_rows(items: list, *, show_market: bool = False, with_long: bool = False) -> list[dict]:
        rows = []
        for p in items:
            row = {
                "信号": _signal_emoji(str(p.get("signal") or "")),
                "名称": p.get("name"),
                "代码": p.get("code"),
                "明日分": f"{float(p['score']):.1f}" if p.get("score") is not None else "—",
                "榜单日涨跌%": f"{float(p['pct']):+.2f}" if p.get("pct") is not None else "—",
                "建议持有": p.get("hold_days") or "—",
                "一句话": (p.get("reason") or "")[:80],
            }
            if with_long and p.get("long_2w"):
                row["2周长线"] = p.get("long_2w")
                row["4~8周"] = p.get("long_4_8w")
            if show_market:
                row = {"市场": p.get("market") or "—", **row}
            rows.append(row)
        return rows

    if not today_picks and not global_picks:
        err = st.session_state.get("_auto_fill_error")
        if err:
            st.error(f"自动预测失败：{err} · 请点上方红色按钮重试。")
        else:
            st.warning(f"还没有明日预测。点 **「预测明日 A 股 + 全球」**（目标 {predict_for}）。")
    else:
        if today_picks:
            st.markdown(f"### 🇨🇳 A股 · 明日偏强（{predict_for}）")
            st.dataframe(
                pd.DataFrame(_pick_rows(today_picks, with_long=True)),
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

    with st.expander("📉 大盘长线风向标（1~2周大跌概率）", expanded=False):
        _render_market_outlook(readonly=readonly, fetch_ranking=_fetch_ranking)

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
- **扫描能力**：明日预测 + **1~2周大跌概率** + 个股2~8周长线
- **记忆**：推荐写入本地，到期自动核对涨没涨
- **隐私**：密码在 `.streamlit/secrets.toml`，别人打不开你的花园
- **免费扩容**：代码在 GitHub，Streamlit Cloud 免费部署，push 即升级

*像种子一样每天长一点 — 你休息，我在扫盘。*
            """
        )
