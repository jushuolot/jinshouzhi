from __future__ import annotations

from datetime import date, timedelta
from typing import Any

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.ui import app_core as C

from src.analysis.brief_merge import (
    build_merged_briefs_html,
    build_merged_briefs_markdown,
    collect_briefs_for_watchlist,
)
from src.analysis.daily_digest import build_watchlist_digest
from src.analysis.mover_insight import build_action_route_report
from src.analysis.quick_analyze import batch_run_quick_analysis, refresh_watch_snapshots, run_quick_analysis
from src.analysis.signals import score_stock
from src.providers import eastmoney
from src.providers.eastmoney import KLINE_PERIOD_UI, is_intraday_kline
from src.providers.news_feed import fetch_aggregated_news
from src.storage.history_store import mark_dirty
from src.storage.serialize import route_report_from_session
from src.ui.alert_panel import render_alert_panel
from src.ui.auto_refresh import auto_refresh_fragment, render_auto_refresh_controls
from src.ui.currency_tool import render_floating_currency_tool
from src.ui.industry_compare import show_industry_compare_block
from src.ui.pro_chart import (
    CHART_INDICATORS,
    DEFAULT_VISIBLE_BARS,
    MAX_VISIBLE_BARS,
    MIN_VISIBLE_BARS,
    PLOTLY_CHART_CONFIG,
    build_pro_chart_multipane,
    last_bar_stats,
)
from src.ui.readable_report_panel import build_and_store_brief, render_readable_brief_panel
from src.ui.sector_alert_panel import render_sector_linkage_panel
from src.ui.speech_summary import render_speech_button
from src.ui.stock_plates_panel import render_stock_plates_panel
from src.util.currency import currency_display, normalize_watchlist
from src.util.query_time import format_data_range, format_query_datetime
from src.util.score_badge import pct_badge, score_badge
from src.util.watchlist_export import (
    filter_watchlist,
    sort_watchlist,
    watchlist_to_csv_bytes,
)


def _watchlist_display_rows(watchlist: list[dict[str, Any]]) -> list[dict[str, Any]]:
    snaps = st.session_state.get("watch_snapshots") or {}
    rows: list[dict[str, Any]] = []
    for item in watchlist:
        code = str(item.get("代码") or "")
        snap = snaps.get(code) or {}
        pct = snap.get("pct")
        score = snap.get("score")
        rows.append(
            {
                "名称": item.get("名称"),
                "代码": code,
                "涨跌幅%": pct_badge(pct) if pct is not None else "—",
                "评分": score_badge(score) if score is not None else "—",
                "一句话": snap.get("one_line") or "—",
                "货币": item.get("货币"),
                "类型": item.get("类型"),
                "市场": item.get("市场"),
            }
        )
    return rows


def render() -> None:
    st.subheader("分析工作台")
    st.caption("选标的 → **一键分析** 或看 K 线 / 财务 / 板块 → 导出简报。")
    C._show_query_banner("watch")
    if st.session_state.watchlist:
        st.session_state.watchlist = normalize_watchlist(st.session_state.watchlist)
    if not st.session_state.watchlist:
        st.info("还没有自选股：到「② 搜索添加」里搜到后加入。")
    else:
        c_refresh, c_hint = st.columns([1, 2])
        with c_refresh:
            if st.button("刷新全部摘要", key="watch_refresh_all", use_container_width=True):
                with st.spinner("正在批量拉取日 K 与评分…"):
                    st.session_state.watch_snapshots = refresh_watch_snapshots(
                        st.session_state.watchlist,
                        C._fetch_one,
                        query_label=C._stamp_query("watch"),
                    )
                    mark_dirty()
                st.success("自选股摘要已更新。")
        with c_hint:
            st.caption("摘要含涨跌幅、评分、一句话；完整分析请对单标的点「一键分析」。")

        snaps = st.session_state.get("watch_snapshots") or {}
        f1, f2, f3 = st.columns([2, 1, 1])
        with f1:
            filter_kw = st.text_input("筛选", key="watch_filter", placeholder="名称 / 代码 / 市场")
        with f2:
            sort_by = st.selectbox("排序", ["代码", "涨跌幅", "评分"], key="watch_sort_by")
        with f3:
            sort_desc = st.checkbox("降序", key="watch_sort_desc")
        display_wl = sort_watchlist(
            filter_watchlist(st.session_state.watchlist, filter_kw),
            snaps,
            by=sort_by,
            descending=sort_desc,
        )
        csv_bytes = watchlist_to_csv_bytes(display_wl, snaps)
        if csv_bytes:
            st.download_button(
                "📊 导出 CSV",
                data=csv_bytes,
                file_name="自选股.csv",
                mime="text/csv",
                key="watch_csv_dl",
                use_container_width=True,
            )

        if snaps:
            digest = build_watchlist_digest(
                display_wl,
                snaps,
                query_label=C._query_label("watch") or format_query_datetime(),
            )
            st.download_button(
                "📋 下载今日自选股速览 (.md)",
                data=digest.encode("utf-8"),
                file_name="自选股速览.md",
                mime="text/markdown",
                key="watch_digest_dl",
                use_container_width=True,
            )

        def _brief_for_code(c: str) -> str | None:
            v = st.session_state.get(f"brief_md_{c}")
            return str(v) if v else None

        briefs = collect_briefs_for_watchlist(display_wl, _brief_for_code)
        if briefs:
            q_merge = C._query_label("watch") or format_query_datetime()
            merged_md = build_merged_briefs_markdown(
                display_wl, briefs, query_label=q_merge
            )
            merged_html = build_merged_briefs_html(
                display_wl, briefs, query_label=q_merge
            )
            m1, m2 = st.columns(2)
            with m1:
                st.download_button(
                    "📚 下载分析合集 (.md)",
                    data=merged_md.encode("utf-8"),
                    file_name="自选股分析合集.md",
                    mime="text/markdown",
                    key="watch_merge_md",
                    use_container_width=True,
                )
            with m2:
                st.download_button(
                    "🖨 下载合集 HTML（可打印 PDF）",
                    data=merged_html.encode("utf-8"),
                    file_name="自选股分析合集.html",
                    mime="text/html",
                    key="watch_merge_html",
                    use_container_width=True,
                )
            st.caption(f"已合并 {len(briefs)} 份一键分析简报；HTML 用浏览器「打印 → 另存为 PDF」。")

        render_auto_refresh_controls()
        auto_refresh_fragment(C._fetch_one)

        render_alert_panel(watchlist=display_wl, snapshots=snaps)

        c_batch, c_batch_hint = st.columns([1, 2])
        with c_batch:
            if st.button("⚡ 深度分析前 3 只", key="watch_batch_quick", use_container_width=True):
                with st.spinner("正在对前 3 只自选股做完整一键分析（约 30–90 秒）…"):
                    q_label = C._stamp_query("watch")
                    results = batch_run_quick_analysis(
                        st.session_state.watchlist,
                        C._fetch_one,
                        max_items=3,
                        query_label=q_label,
                    )
                    if not results:
                        st.error("批量分析失败，请检查网络或稍后重试。")
                    else:
                        if "watch_snapshots" not in st.session_state:
                            st.session_state.watch_snapshots = {}
                        for code, res in results.items():
                            st.session_state.watch_snapshots[code] = res.snapshot.as_dict()
                            st.session_state[f"brief_md_{code}"] = res.brief_md
                        first = next(iter(results.values()))
                        st.session_state["route_report"] = first.route_report
                        st.session_state["insight_pick"] = {
                            "代码": first.snapshot.code,
                            "名称": first.snapshot.name,
                            "市场": next(
                                (x.get("市场") for x in st.session_state.watchlist if x.get("代码") == first.snapshot.code),
                                "",
                            ),
                        }
                        mark_dirty()
                        C._save_history(
                            log_kind="insight",
                            log_label=f"批量一键分析 {len(results)} 只",
                            conclusions_summary=f"完成{len(results)}只",
                        )
                        st.success(f"已完成 {len(results)} 只的深度分析与简报。")
        with c_batch_hint:
            st.caption("依次生成简报并写入各标的；适合早晨快速过一遍重点自选。")

        wl = pd.DataFrame(_watchlist_display_rows(display_wl))
        show_cols = [c for c in ["名称", "代码", "涨跌幅%", "评分", "一句话", "货币", "类型", "市场"] if c in wl.columns]
        st.dataframe(
            wl[show_cols] if show_cols else wl,
            use_container_width=True,
            hide_index=True,
            column_config={
                "货币": st.column_config.TextColumn("货币", help="报价货币：A股 CNY / 港股 HKD / 美股 USD"),
                "一句话": st.column_config.TextColumn("一句话", width="large"),
            },
        )
        codes = [str(x.get("代码") or "") for x in st.session_state.watchlist]
        to_remove = st.multiselect("删除哪些（按代码）", options=codes)
        if st.button("删除所选", use_container_width=True, disabled=not to_remove):
            st.session_state.watchlist = [x for x in st.session_state.watchlist if x.get("代码") not in set(to_remove)]
            mark_dirty()
            C._save_history(log_kind="watchlist", log_label="删除自选股")
            st.rerun()

        render_sector_linkage_panel(watchlist=display_wl)

        st.divider()
        st.subheader("行情与分析")
        code = st.selectbox("选择标的（按代码）", options=wl["代码"].tolist(), key="watch_code")
        item = next((x for x in st.session_state.watchlist if x.get("代码") == code), None)
        kind = str(item.get("类型") or "A") if item else "A"
        quote_ccy = str(item.get("货币") or "CNY") if item else "CNY"
        if item:
            st.caption(f"报价货币：**{currency_display(quote_ccy)}**")
            render_floating_currency_tool(default_from=quote_ccy, watch_code=code)
            snap_one = (st.session_state.get("watch_snapshots") or {}).get(code) or {}
            one_line = str(snap_one.get("one_line") or "").strip()
            if one_line and one_line not in ("—", "暂无评分。"):
                render_speech_button(text=one_line, key=f"speech_{code}")
        is_a6 = item and C._is_a_share_code6(code) and kind == "A"
        watch_df: pd.DataFrame | None = None
        watch_ksrc = ""
        watch_stats: dict[str, Any] | None = None
        watch_score = None

        if item:
            with st.expander("K线", expanded=True):
                chart_h = st.selectbox(
                    "图高度",
                    [720, 900, 1080],
                    index=1,
                    format_func=lambda x: f"{x}px",
                    key="watch_chart_h",
                )
                if "watch_visible_bars" not in st.session_state:
                    st.session_state.watch_visible_bars = DEFAULT_VISIBLE_BARS
                kline = st.radio(
                    "周期",
                    options=list(KLINE_PERIOD_UI),
                    horizontal=True,
                    key="watch_kline_period",
                )
                z1, z2, z3, z4 = st.columns([1, 1, 2, 2])
                with z1:
                    if st.button("拉长K线", help="减少可见 K 线根数，单根更宽", key="watch_zoom_in"):
                        st.session_state.watch_visible_bars = max(
                            MIN_VISIBLE_BARS,
                            int(st.session_state.watch_visible_bars) - 30,
                        )
                        st.rerun()
                with z2:
                    if st.button("缩短K线", help="增加可见 K 线根数，单根更窄", key="watch_zoom_out"):
                        st.session_state.watch_visible_bars = min(
                            MAX_VISIBLE_BARS,
                            int(st.session_state.watch_visible_bars) + 30,
                        )
                        st.rerun()
                with z3:
                    st.caption(f"当前可见约 **{st.session_state.watch_visible_bars}** 根 · 滚轮可缩放")
                with z4:
                    indicator = st.selectbox(
                        "副图指标",
                        options=list(CHART_INDICATORS),
                        index=0,
                        key="watch_indicator",
                    )
                intraday = is_intraday_kline(kline)
                day_opts = [5, 10, 30] if intraday else [30, 90, 180, 365, 730]
                day_idx = 1 if intraday else 2
                days = st.selectbox(
                    "回看天数",
                    options=day_opts,
                    index=min(day_idx, len(day_opts) - 1),
                    key="watch_days",
                )
                end = date.today()
                start = end - timedelta(days=int(days) + 10)
                try:
                    watch_df, watch_ksrc = C._fetch_one(item, start=start, end=end, kline=kline)
                except Exception as e:
                    st.error(f"获取行情失败：{e}")
                else:
                    df, ksrc = watch_df, watch_ksrc
                    q_label = C._stamp_query("watch")
                    stats = last_bar_stats(df)
                    title = f"{item.get('名称', '')}（{code}）"
                    if stats:
                        m1, m2, m3, m4, m5 = st.columns(5)
                        pct = stats.get("涨跌幅%") or 0
                        m1.metric("最新收盘", f"{stats.get('收盘', 0):.2f}")
                        m2.metric("涨跌幅", f"{pct:+.2f}%", delta=f"{stats.get('涨跌额', 0):+.2f}")
                        m3.metric("最高", f"{stats.get('最高', 0):.2f}")
                        m4.metric("最低", f"{stats.get('最低', 0):.2f}")
                        vol = stats.get("成交量")
                        m5.metric("成交量", f"{vol:,.0f}" if vol is not None else "—")
                        st.caption(
                            f"行情：{ksrc}　|　报价货币：{currency_display(quote_ccy)}　|　查询：{q_label}　|　"
                            f"区间：{format_data_range(start, end)}　|　最新交易日：{stats.get('日期', '')}"
                        )
                    else:
                        st.info(
                            f"报价货币：{currency_display(quote_ccy)}　|　"
                            f"行情来源：{ksrc}　|　本次查询：{q_label}"
                        )
                    if intraday and kind != "A":
                        st.warning("分钟 K 线仅支持沪深京 A 股东方财富；当前标的将尝试日线或可能无数据。")
                    fig = build_pro_chart_multipane(
                        df,
                        f"{title} · {currency_display(quote_ccy)}",
                        indicator=indicator,
                        show_ma=(5, 10, 20, 60),
                        visible_bars=int(st.session_state.watch_visible_bars),
                        height=int(chart_h),
                    )
                    st.plotly_chart(fig, use_container_width=True, config=PLOTLY_CHART_CONFIG)
                    s = score_stock(df)
                    watch_stats = stats
                    watch_score = s
                    st.metric("综合评分", f"{s.total:.1f}")
                    st.caption("评分拆分：趋势/动量/风险/流动性")
                    st.write({"趋势": s.trend, "动量": s.momentum, "风险": s.risk, "流动性": s.liquidity})
                    for n in s.notes:
                        st.write(f"- {n}")
                    st.data_editor(
                        df.sort_values("日期", ascending=False).head(200),
                        use_container_width=True,
                        hide_index=True,
                    )

            with st.expander("财务对比", expanded=False):
                show_industry_compare_block(
                    code=code,
                    kind=kind,
                    lazy=True,
                    load_key=f"watch_fin_{code}",
                )

            if is_a6:
                with st.expander("所属板块", expanded=False):
                    render_stock_plates_panel(
                        code=code,
                        name=str(item.get("名称") or ""),
                        key_prefix=f"watch_{code}",
                        on_add_watchlist=C._add_a_watchlist_by_code,
                        lazy=True,
                    )

            st.divider()
            st.subheader("分析与导出")
            code6 = code if kind == "A" and code.isdigit() else None
            yh = str(item.get("Yahoo") or code)
            news_watch = fetch_aggregated_news(code6=code6, yahoo_ticker=yh, limit=15)

            if st.button("⚡ 一键分析", type="primary", key="watch_quick", use_container_width=True):
                try:
                    with st.spinner("并行拉取行情、新闻、财务对比并生成简报…"):
                        q_label = C._stamp_query("watch")
                        result = run_quick_analysis(
                            item,
                            C._fetch_one,
                            query_label=q_label,
                        )
                    watch_df = result.df
                    watch_ksrc = result.kline_src
                    watch_stats = result.stats
                    watch_score = result.score
                    st.session_state.watch_snapshots[code] = result.snapshot.as_dict()
                    st.session_state["route_report"] = result.route_report
                    st.session_state["insight_pick"] = {
                        "代码": code,
                        "名称": item.get("名称"),
                        "市场": item.get("市场"),
                    }
                    st.session_state[f"brief_md_{code}"] = result.brief_md
                    if result.fin_data and result.fin_data.get("ok"):
                        st.session_state[f"watch_fin_{code}"] = True
                    mark_dirty()
                    C._save_history(
                        log_kind="insight",
                        log_label=f"一键分析 {item.get('名称')}",
                        conclusions_summary=result.snapshot.one_line[:120],
                    )
                    st.success("一键分析完成：摘要、行动路线、可读简报已就绪。")
                except Exception as e:
                    st.error(f"一键分析失败：{e}")

            btn_route, btn_brief = st.columns(2)
            with btn_route:
                gen_route = st.button("生成行动路线", type="primary", key="watch_route", use_container_width=True)
            with btn_brief:
                gen_brief = st.button("生成可读简报", key="watch_brief", use_container_width=True)

            if gen_route:
                if watch_df is None or watch_df.empty:
                    route_end = date.today()
                    route_start = route_end - timedelta(days=100)
                    try:
                        watch_df, watch_ksrc = C._fetch_one(
                            item, start=route_start, end=route_end, kline="日K"
                        )
                        watch_stats = last_bar_stats(watch_df)
                        watch_score = score_stock(watch_df)
                    except Exception as e:
                        st.error(f"无法生成报告：{e}")
                        watch_df = None
                if watch_df is not None and not watch_df.empty:
                    q_label = C._stamp_query("insight")
                    with st.spinner("正在聚合行情与新闻…"):
                        rep = build_action_route_report(
                            name=str(item.get("名称") or ""),
                            code=code,
                            kind=kind,
                            df=watch_df,
                            kline_src=watch_ksrc,
                            query_label=q_label,
                        )
                    st.session_state["route_report"] = rep
                    st.session_state["insight_pick"] = {
                        "代码": code,
                        "名称": item.get("名称"),
                        "市场": item.get("市场"),
                    }
                    mark_dirty()
                    C._save_history(log_kind="insight", log_label=f"工作台溯源 {item.get('名称')}")
                    st.success("行动路线已生成，见下方展开区。")

            if gen_brief:
                if watch_df is None or watch_df.empty:
                    st.warning("请先在上方「K线」区加载行情（展开后自动拉取）。")
                else:
                    rep_brief = route_report_from_session(st.session_state.get("route_report"))
                    pick = st.session_state.get("insight_pick") or {}
                    if pick and str(pick.get("代码") or "") != str(code):
                        rep_brief = None
                    with st.spinner("正在整理可读简报…"):
                        build_and_store_brief(
                            session_key=f"brief_md_{code}",
                            name=str(item.get("名称") or ""),
                            code=code,
                            kind=kind,
                            market=str(item.get("市场") or ""),
                            currency=quote_ccy,
                            stats=watch_stats,
                            score=watch_score,
                            kline_src=watch_ksrc,
                            query_label=C._query_label("watch") or format_query_datetime(),
                            route_report=rep_brief,
                            news=news_watch,
                        )
                    st.success("可读简报已生成，见下方。")

            rep_inline = route_report_from_session(st.session_state.get("route_report"))
            pick_inline = st.session_state.get("insight_pick") or {}
            if rep_inline and str(pick_inline.get("代码") or "") == str(code):
                with st.expander("📋 行动路线", expanded=False):
                    C._render_route_report_block(rep_inline)

            brief_md = st.session_state.get(f"brief_md_{code}")
            if brief_md:
                render_readable_brief_panel(
                    brief_md=brief_md,
                    file_stem=f"{item.get('名称', '')}_{code}",
                    key_prefix=f"watch_brief_{code}",
                )

            with st.expander("重大新闻（多源）", expanded=False):
                if not news_watch:
                    st.info("暂无新闻或接口不可用。")
                else:
                    for n in news_watch:
                        ntitle = n.get("标题") or ""
                        link = n.get("链接") or ""
                        src = n.get("来源") or ""
                        when = n.get("时间") or ""
                        if link:
                            st.markdown(f"- [{ntitle}]({link})（{src} {when}）")
                        else:
                            st.write(f"- {ntitle}（{src} {when}）")

