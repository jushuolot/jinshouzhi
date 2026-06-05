from __future__ import annotations

import hashlib
from typing import Any
import io
import os
from datetime import date, datetime, timedelta

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

from src.analysis.mover_insight import (
    ActionRouteReport,
    build_action_route_report,
    build_action_route_report_from_snapshot,
)
from src.providers.ticker_util import a_market_label, is_bj_code, yahoo_ticker_a
from src.analysis.signals import score_stock
from src.providers import eastmoney, eastmoney_plates, market_data, symbol_search, yahoo
from src.providers.news_feed import fetch_aggregated_news
from src.ui.industry_compare import show_industry_compare_block
from src.ui.movers_table import render_movers_table, sync_mover_pick_from_query
from src.ui.stock_plates_panel import render_stock_plates_panel
from src.providers.eastmoney import KLINE_PERIOD_UI, is_intraday_kline
from src.ui.pro_chart import (
    CHART_INDICATORS,
    DEFAULT_VISIBLE_BARS,
    MAX_VISIBLE_BARS,
    MIN_VISIBLE_BARS,
    PLOTLY_CHART_CONFIG,
    build_pro_chart_multipane,
    last_bar_stats,
)
from src.util.query_time import format_data_range, format_query_date, format_query_datetime
from src.util.currency import (
    currency_display,
    enrich_watchlist_item,
    infer_currency_for_hit,
    normalize_watchlist,
)
from src.ui.currency_tool import render_floating_currency_tool
from src.analysis.capital_attribution import CapitalMix, capital_mix_from_dict
from src.analysis.global_anomaly import (
    analyze_movers_batch,
    analyze_one_mover_deep,
    summary_dataframe,
)
from src.analysis.industry_recommend import build_industry_clusters
from src.analysis.timeframe_impact import slices_to_rows
from src.storage.history_store import (
    KIND_LABELS,
    filter_query_log,
    format_log_option,
    get_snapshot_by_id,
    history_path,
    load_history,
    load_into_session,
    mark_dirty,
    persist_session,
    restore_snapshot,
    unique_dates_from_log,
    unique_stocks_from_log,
)
from src.storage.serialize import (
    capital_mix_to_dict,
    panorama_detail_from_dict,
    route_report_from_session,
)


def _get_password() -> str | None:
    # secrets 优先
    try:
        v = st.secrets.get("STOCK_ASSISTANT_PASSWORD")
        if v is not None and str(v).strip():
            return str(v).strip()
    except Exception:
        pass
    env = os.environ.get("STOCK_ASSISTANT_PASSWORD", "").strip()
    return env or None


def _login_gate() -> None:
    expected = _get_password()
    if not expected:
        st.title("访问验证")
        st.error(
            "尚未配置访问密码。请先设置后再启动：\n\n"
            "- 复制 `.streamlit/secrets.toml.example` 为 `.streamlit/secrets.toml` 并修改密码；或\n"
            "- 终端里执行：`export STOCK_ASSISTANT_PASSWORD='你的强密码'` 后再启动。"
        )
        st.stop()

    if "_auth_ok" not in st.session_state:
        st.session_state["_auth_ok"] = False

    if st.session_state["_auth_ok"]:
        return

    st.title("访问验证")
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        with st.form("login_form"):
            pw = st.text_input("访问密码", type="password")
            ok = st.form_submit_button("登录", type="primary", use_container_width=True)
        if ok:
            if pw == expected:
                st.session_state["_auth_ok"] = True
                st.rerun()
            else:
                st.error("密码错误。")
    st.stop()


def _init_state() -> None:
    if "watchlist" not in st.session_state:
        st.session_state.watchlist = []  # list[dict]
    if "last_hits" not in st.session_state:
        st.session_state.last_hits = []
    if "query_log" not in st.session_state:
        st.session_state.query_log = []
    if "history_snapshots" not in st.session_state:
        st.session_state.history_snapshots = []


def _save_history(
    *,
    log_kind: str | None = None,
    log_label: str = "",
    market: str = "",
    board: str = "",
    count: int = 0,
    conclusions_summary: str = "",
) -> None:
    persist_session(
        log_kind=log_kind,
        log_label=log_label,
        market=market,
        board=board,
        count=count,
        conclusions_summary=conclusions_summary,
    )


def _stamp_query(scope: str) -> str:
    """记录各模块查询时间并返回展示文案。"""
    ts = datetime.now()
    st.session_state[f"query_at_{scope}"] = ts
    st.session_state["query_at_latest"] = ts
    label = format_query_datetime(ts)
    st.session_state[f"query_label_{scope}"] = label
    return label


def _query_label(scope: str) -> str:
    return str(st.session_state.get(f"query_label_{scope}") or "")


def _show_query_banner(scope: str | None = None, *, extra: str = "") -> None:
    key = f"query_label_{scope}" if scope else None
    label = _query_label(scope) if key and st.session_state.get(f"query_at_{scope}") else ""
    if not label and st.session_state.get("query_at_latest"):
        label = format_query_datetime(st.session_state["query_at_latest"])
    if label:
        suffix = f"　{extra}" if extra else ""
        st.caption(f"📅 本次查询时间：{label}{suffix}")


def _pick_kind(pick: dict) -> str:
    k = str(pick.get("类型") or "").strip().upper()
    if k in ("A", "HK", "US"):
        return k
    m = str(pick.get("市场") or "")
    if "港" in m:
        return "HK"
    if "美" in m:
        return "US"
    return "A"


def _hit_label(h: eastmoney.SearchHit) -> str:
    code = h.code
    if h.kind in ("US", "HK") and h.yahoo:
        code = h.yahoo
    return f"{h.name}  ({code})  [{h.market}]"


def _add_to_watchlist(h: eastmoney.SearchHit) -> None:
    code = h.code
    yahoo_code = h.yahoo
    kind = h.kind
    if kind in ("US", "HK") and yahoo_code:
        code = yahoo_code
    item = enrich_watchlist_item(
        {
            "名称": h.name,
            "代码": code,
            "类型": kind,
            "市场": h.market,
            "Yahoo": yahoo_code,
            "货币": infer_currency_for_hit(
                kind=kind, market=h.market, code=code, yahoo=yahoo_code or ""
            ),
        }
    )
    exists = any(x.get("代码") == item["代码"] for x in st.session_state.watchlist)
    if not exists:
        st.session_state.watchlist.append(item)
        mark_dirty()
        _save_history(log_kind="watchlist", log_label=f"加入自选股 {h.name}")


def _add_a_watchlist_by_code(code: str, name: str) -> None:
    c = str(code).strip().zfill(6)
    _add_to_watchlist(
        eastmoney.SearchHit(
            code=c,
            name=str(name or c),
            market=a_market_label(c),
            kind="A",
            yahoo=yahoo_ticker_a(c),
        )
    )


def _is_a_share_code6(code: str) -> bool:
    c = str(code or "").strip().split(".")[0]
    return c.isdigit() and len(c) <= 6


def _capital_mix_for_chart(cap: CapitalMix | dict[str, Any] | Any) -> tuple[dict[str, float], list[str]]:
    """Accept CapitalMix or persisted dict; return pie data and notes."""
    mix = capital_mix_from_dict(cap)
    return mix.as_dict(), list(mix.notes)


@st.cache_data(ttl=300, show_spinner=False)
def _cached_kline(kind: str, code: str, kline: str, start_iso: str, end_iso: str) -> tuple[pd.DataFrame, str]:
    return market_data.fetch_kline_multi(
        kind=kind,
        code=code,
        kline=kline,
        start=date.fromisoformat(start_iso),
        end=date.fromisoformat(end_iso),
    )


@st.cache_data(ttl=300, show_spinner=False)
def _cached_panorama_batch(
    movers_csv: str,
    market: str,
    limit: int,
    query_label: str,
) -> tuple[list[dict], list[dict]]:
    """快速批量分析（无网络），结果可缓存 5 分钟。"""
    movers = pd.read_csv(io.StringIO(movers_csv))
    analyses = analyze_movers_batch(
        movers,
        market=market,
        limit=int(limit),
        query_label=query_label,
        mode="fast",
    )
    summaries = [a.to_summary_dict() for a in analyses]
    details = [
        {
            "code": a.code,
            "name": a.name,
            "market": a.market,
            "kind": a.kind,
            "anomaly_score": a.anomaly_score,
            "capital": capital_mix_to_dict(a.capital),
            "timeframes": a.timeframes,
            "context": a.context,
            "news": a.news,
            "snapshot": a.snapshot,
            "mode": a.mode,
        }
        for a in analyses
    ]
    return summaries, details


def _movers_csv_fingerprint(df: pd.DataFrame) -> str:
    return hashlib.md5(df.to_csv(index=False).encode("utf-8")).hexdigest()


def _fetch_one(item: dict, *, start: date, end: date, kline: str) -> tuple[pd.DataFrame, str]:
    kind = str(item.get("类型") or "")
    code = str(item.get("代码") or "").strip()
    return _cached_kline(kind, code, kline, start.isoformat(), end.isoformat())


def _run_insight_report(*, name: str, code: str, days: int, pick: dict) -> None:
    q_label = _stamp_query("insight")
    end = date.today()
    start = end - timedelta(days=int(days) + 10)
    kind = _pick_kind(pick)
    yahoo_code = str(pick.get("Yahoo代码") or code).strip()
    fetch_code = yahoo_code if kind in ("HK", "US") else code
    market = str(st.session_state.get("movers_market") or "")
    board = str(st.session_state.get("insight_board") or "")
    board_hint = f"{market} · {board}".strip(" · ") if market or board else board
    try:
        with st.spinner("① 拉取行情（多源，约 5–20 秒）…"):
            df, ksrc = _cached_kline(kind, fetch_code, "日线", start.isoformat(), end.isoformat())
        with st.spinner("② 聚合新闻并生成行动路线…"):
            rep = build_action_route_report(
                name=name,
                code=code,
                kind=kind,
                df=df,
                kline_src=ksrc,
                board_hint=board_hint,
                query_label=q_label,
            )
        st.session_state["route_report"] = rep
        st.session_state["insight_range"] = format_data_range(start, end)
        mark_dirty()
        _save_history(
            log_kind="insight",
            log_label=f"异动溯源 {name}（{code}）",
            conclusions_summary=f"溯源:{rep.result[:120]}",
        )
        st.success(f"报告已生成。（查询日 {format_query_date(end)}）")
    except Exception as e:
        snap_price = pick.get("最新价")
        if snap_price is not None or pick.get("涨跌幅%") is not None:
            with st.spinner("K 线不可用，正在用榜单快照生成简版报告…"):
                rep = build_action_route_report_from_snapshot(
                    name=name,
                    code=code,
                    snapshot=pick,
                    board_hint=board_hint,
                    query_label=q_label,
                )
            st.session_state["route_report"] = rep
            mark_dirty()
            _save_history(log_kind="insight", log_label=f"异动溯源简版 {name}（{code}）")
            st.warning(f"完整 K 线未拉到（{e}），已生成简版报告。")
        else:
            hint = "北交所（92 开头）可稍后重试，或先在「全球股市」刷新榜单再生成。" if is_bj_code(code) else ""
            st.error(str(e))
            if hint:
                st.caption(hint)


def _apply_pending_session_keys() -> None:
    pending = st.session_state.pop("_pending_movers_pick_code", None)
    if pending is not None:
        st.session_state["movers_pick_code"] = pending


st.set_page_config(page_title="Stock Assistant", layout="wide")
_login_gate()
_init_state()
load_into_session()
_apply_pending_session_keys()

st.title("Stock Assistant（全市场）")
st.caption(
    "多源公开数据：A 股（东财→新浪）、港股/美股（Yahoo）。"
    "全球股市页可生成「行动路线」：结果→过程→原因→参与者→思路（规则推演，非投资建议）。"
)
if st.session_state.get("query_at_latest"):
    st.info(f"📅 最近查询时间：{format_query_datetime(st.session_state['query_at_latest'])}")

tab_watch, tab_search, tab_plates, tab_movers, tab_panorama, tab_insight, tab_history = st.tabs(
    ["自选股", "搜索/添加", "板块行情", "全球股市", "异动全景", "异动溯源", "历史记录"]
)

with tab_search:
    st.subheader("全球证券搜索")
    st.caption("并行查询：A 股/北交所（东财）+ 港股/美股/英文名（Yahoo）。支持 XSHE:300755、SNX、synnex、茅台、0700.HK 等。")
    _show_query_banner("search")
    kw = st.text_input("关键词", value="茅台", placeholder="中文名、代码、拼音、美股代码 SNX、公司英文名 synnex…")
    col1, col2 = st.columns([1, 1])
    with col1:
        if st.button("全球搜索", type="primary", use_container_width=True):
            with st.spinner("正在并行搜索 A 股 / 港股 / 美股…"):
                st.session_state.last_hits = symbol_search.suggest(kw, limit=40)
            _stamp_query("search")
    with col2:
        st.caption("每次同时查东财与 Yahoo，不是只搜 A 股。")

    hits: list[eastmoney.SearchHit] = st.session_state.last_hits or []
    if hits:
        cnt = symbol_search.count_by_kind(hits)
        st.success(
            f"共 {len(hits)} 条 · A股 {cnt['A']} · 港股 {cnt['HK']} · 美股 {cnt['US']}"
            + (f" · 其他 {cnt['OTHER']}" if cnt["OTHER"] else "")
        )
        labels = [_hit_label(h) for h in hits]
        idx = st.selectbox("选择证券", range(len(labels)), format_func=lambda i: labels[i])
        h = hits[int(idx)]
        if h.kind in ("US", "HK") and h.yahoo:
            try:
                prof = yahoo.fetch_profile(h.yahoo)
                st.write(
                    {
                        "名称": prof.name,
                        "代码": prof.ticker,
                        "交易所": prof.exchange,
                        "行业": prof.industry,
                        "板块": prof.sector,
                    }
                )
                if prof.long_business_summary:
                    st.caption(prof.long_business_summary[:500] + ("…" if len(prof.long_business_summary) > 500 else ""))
            except Exception as e:
                st.warning(f"简介拉取失败：{e}")
        else:
            st.write(eastmoney.fetch_company_profile_stub(h))
        if st.button("加入自选股", use_container_width=True):
            _add_to_watchlist(h)
            _save_history(log_kind="watchlist", log_label=f"加入自选股 {h.name}")
            st.success("已加入自选股。")
    else:
        st.info("输入关键词后点「全球搜索」。纯英文公司名（如 synnex）请直接搜，会走 Yahoo。")

with tab_watch:
    st.subheader("自选股")
    _show_query_banner("watch")
    if st.session_state.watchlist:
        st.session_state.watchlist = normalize_watchlist(st.session_state.watchlist)
    if not st.session_state.watchlist:
        st.info("还没有自选股：到「搜索/添加」里搜到后加入。")
    else:
        wl = pd.DataFrame(st.session_state.watchlist)
        show_cols = [c for c in ["名称", "代码", "货币", "类型", "市场", "Yahoo"] if c in wl.columns]
        st.dataframe(
            wl[show_cols] if show_cols else wl,
            use_container_width=True,
            hide_index=True,
            column_config={
                "货币": st.column_config.TextColumn("货币", help="报价货币：A股 CNY / 港股 HKD / 美股 USD"),
            },
        )
        to_remove = st.multiselect("删除哪些（按代码）", options=wl["代码"].tolist())
        if st.button("删除所选", use_container_width=True, disabled=not to_remove):
            st.session_state.watchlist = [x for x in st.session_state.watchlist if x.get("代码") not in set(to_remove)]
            mark_dirty()
            _save_history(log_kind="watchlist", log_label="删除自选股")
            st.rerun()

        st.divider()
        st.subheader("行情与分析")
        code = st.selectbox("选择标的（按代码）", options=wl["代码"].tolist(), key="watch_code")
        item = next((x for x in st.session_state.watchlist if x.get("代码") == code), None)
        kind = str(item.get("类型") or "A") if item else "A"
        quote_ccy = str(item.get("货币") or "CNY") if item else "CNY"
        if item:
            st.caption(f"报价货币：**{currency_display(quote_ccy)}**")
            render_floating_currency_tool(default_from=quote_ccy, watch_code=code)
        is_a6 = item and _is_a_share_code6(code) and kind == "A"
        watch_df: pd.DataFrame | None = None
        watch_ksrc = ""

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
                    watch_df, watch_ksrc = _fetch_one(item, start=start, end=end, kline=kline)
                except Exception as e:
                    st.error(f"获取行情失败：{e}")
                else:
                    df, ksrc = watch_df, watch_ksrc
                    q_label = _stamp_query("watch")
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
                        on_add_watchlist=_add_a_watchlist_by_code,
                        lazy=True,
                    )

            st.subheader("重大新闻（多源）")
            code6 = code if kind == "A" and code.isdigit() else None
            yh = str(item.get("Yahoo") or code)
            news = fetch_aggregated_news(code6=code6, yahoo_ticker=yh, limit=15)
            if not news:
                st.info("暂无新闻或接口不可用。")
            else:
                for n in news:
                    ntitle = n.get("标题") or ""
                    link = n.get("链接") or ""
                    src = n.get("来源") or ""
                    when = n.get("时间") or ""
                    if link:
                        st.markdown(f"- [{ntitle}]({link})（{src} {when}）")
                    else:
                        st.write(f"- {ntitle}（{src} {when}）")

            if st.button("生成行动路线报告", key="watch_route"):
                if watch_df is None or watch_df.empty:
                    route_end = date.today()
                    route_start = route_end - timedelta(days=100)
                    try:
                        watch_df, watch_ksrc = _fetch_one(
                            item, start=route_start, end=route_end, kline="日K"
                        )
                    except Exception as e:
                        st.error(f"无法生成报告：{e}")
                        watch_df = None
                if watch_df is not None and not watch_df.empty:
                    q_label = _stamp_query("insight")
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
                    }
                    mark_dirty()
                    _save_history(log_kind="insight", log_label=f"自选股溯源 {item.get('名称')}")
                    st.success("报告已生成，请切换到「异动溯源」页查看。")

with tab_plates:
    st.subheader("板块行情")
    st.caption(
        "行业 / 概念 / 地区板块与资金流向，字段对齐主流行情软件（东财公开接口）。"
        "「相关链接」可打开东财板块页。"
    )
    _show_query_banner("plates")
    plates_n = st.slider("显示条数", min_value=10, max_value=80, value=40, step=5, key="plates_top_n")
    plates_sort = st.selectbox("榜单", options=["涨幅榜", "跌幅榜"], index=0, key="plates_sort")
    st.caption("主力净流入单位为万元（东财原始为元 ÷10000）。")

    def _plates_display_cols(df: pd.DataFrame) -> pd.DataFrame:
        cols = [
            "板块名称",
            "相关链接",
            "最新价",
            "涨跌额",
            "涨跌幅",
            "主力净流入",
            "领涨股",
            "领涨股涨跌幅",
        ]
        have = [c for c in cols if c in df.columns]
        return df[have] if have else df

    def _render_plate_table(
        df: pd.DataFrame | None,
        *,
        query_key: str,
        tab_key: str,
        show_lead_pick: bool,
    ) -> None:
        if df is None:
            st.info("选择子页后点击「刷新」加载板块数据。")
            return
        if df.empty:
            st.warning("暂未拉到板块数据，请稍后重试或检查网络（需能访问东财 push2 接口）。")
            return
        q = _query_label(query_key) or format_query_datetime()
        st.caption(f"查询时间：{q}　共 {len(df)} 条")
        st.dataframe(
            _plates_display_cols(df),
            use_container_width=True,
            hide_index=True,
            column_config={
                "相关链接": st.column_config.LinkColumn("相关链接", display_text="打开"),
                "涨跌幅": st.column_config.NumberColumn("涨跌幅", format="%.2f%%"),
                "领涨股涨跌幅": st.column_config.NumberColumn("领涨股涨跌幅", format="%.2f%%"),
                "主力净流入": st.column_config.NumberColumn("主力净流入(万)", format="%.2f"),
            },
        )
        if show_lead_pick and "领涨股代码" in df.columns:
            leads = df.loc[
                df["领涨股代码"].astype(str).str.len() >= 4,
                ["领涨股", "领涨股代码"],
            ].drop_duplicates(subset=["领涨股代码"])
            if not leads.empty:
                idx = st.selectbox(
                    "领涨股快捷操作",
                    options=range(len(leads)),
                    format_func=lambda i: f"{leads.iloc[i]['领涨股']} ({leads.iloc[i]['领涨股代码']})",
                    key=f"plates_lead_{tab_key}",
                )
                row = leads.iloc[int(idx)]
                code = str(row["领涨股代码"])
                name = str(row["领涨股"])
                if st.button("加入自选股", key=f"plates_add_lead_{tab_key}"):
                    h = eastmoney.SearchHit(
                        code=code,
                        name=name,
                        market="A股",
                        kind="A",
                        yahoo=yahoo_ticker_a(code),
                    )
                    _add_to_watchlist(h)
                    st.success(f"已加入：{name}（{code}）")

    t_plate_ind, t_plate_con, t_plate_reg, t_plate_flow = st.tabs(
        ["行业板块", "概念板块", "地区板块", "资金流向"]
    )

    with t_plate_ind:
        if st.button("刷新行业板块", type="primary", key="plates_refresh_ind"):
            with st.spinner("正在拉取行业板块…"):
                st.session_state["plates_ind"] = eastmoney_plates.fetch_plate_board(
                    category="行业板块", board=plates_sort, limit=plates_n
                )
            _stamp_query("plates")
        _render_plate_table(
            st.session_state.get("plates_ind"),
            query_key="plates",
            tab_key="ind",
            show_lead_pick=True,
        )

    with t_plate_con:
        if st.button("刷新概念板块", type="primary", key="plates_refresh_con"):
            with st.spinner("正在拉取概念板块…"):
                st.session_state["plates_con"] = eastmoney_plates.fetch_plate_board(
                    category="概念板块", board=plates_sort, limit=plates_n
                )
            _stamp_query("plates")
        _render_plate_table(
            st.session_state.get("plates_con"),
            query_key="plates",
            tab_key="con",
            show_lead_pick=True,
        )

    with t_plate_reg:
        if st.button("刷新地区板块", type="primary", key="plates_refresh_reg"):
            with st.spinner("正在拉取地区板块…"):
                st.session_state["plates_reg"] = eastmoney_plates.fetch_plate_board(
                    category="地区板块", board=plates_sort, limit=plates_n
                )
            _stamp_query("plates")
        _render_plate_table(
            st.session_state.get("plates_reg"),
            query_key="plates",
            tab_key="reg",
            show_lead_pick=True,
        )

    with t_plate_flow:
        st.caption("按主力净流入降序（行业 + 概念 + 地区合并展示）。")
        if st.button("刷新资金流向", type="primary", key="plates_refresh_flow"):
            with st.spinner("正在拉取资金流向…"):
                st.session_state["plates_flow"] = eastmoney_plates.fetch_flow_board(limit=plates_n)
            _stamp_query("plates")
        _render_plate_table(
            st.session_state.get("plates_flow"),
            query_key="plates",
            tab_key="flow",
            show_lead_pick=False,
        )

with tab_movers:
    st.subheader("全球股市")
    st.caption("A 股：东财→新浪；港股/美股：Yahoo Finance 筛选榜单（盘中/收盘数据以源站为准）。")
    _show_query_banner("movers")
    market = st.selectbox(
        "市场",
        options=["A股", "港股", "美股"],
        index=0,
        key="movers_market_select",
    )
    board = st.selectbox(
        "榜单类型",
        options=["涨幅榜", "跌幅榜", "成交额榜", "换手率榜"],
        index=0,
    )
    if market != "A股" and board == "换手率榜":
        st.caption("换手率榜主要适用于 A 股；港/美股将按涨跌幅展示。")
    top_n = st.slider("显示条数", min_value=10, max_value=80, value=30, step=5)
    if st.button("刷新榜单", type="primary", use_container_width=True):
        with st.spinner("正在从公开源拉取榜单…"):
            df, src = market_data.fetch_global_ranking_multi(
                market=market, board=board, limit=top_n
            )
        st.session_state["movers_df"] = df
        st.session_state["movers_board"] = board
        st.session_state["movers_src"] = src
        st.session_state["movers_market"] = market
        _stamp_query("movers")
        mark_dirty()
        _save_history(
            log_kind="movers",
            log_label=f"{market} {board} 榜单",
            market=market,
            board=board,
            count=len(df),
        )

    movers = st.session_state.get("movers_df")
    if movers is None:
        st.info("选择市场与榜单类型后，点「刷新榜单」加载。")
    elif movers.empty:
        st.warning("暂未拉到榜单数据。可切换市场或稍后重试，也可到「搜索/添加」直接查个股。")
    else:
        q_movers = _query_label("movers")
        st.success(
            f"榜单来源：{st.session_state.get('movers_src', '')}　|　"
            f"市场：{st.session_state.get('movers_market', market)}　|　"
            f"查询日期：{q_movers or format_query_datetime()}"
        )
        sync_mover_pick_from_query()
        codes = movers["代码"].astype(str).str.replace(r"\.0$", "", regex=True).tolist()
        cur = str(st.session_state.get("movers_pick_code") or "").replace(".0", "")
        if cur not in codes:
            st.session_state["movers_pick_code"] = codes[0]
        render_movers_table(
            movers,
            selected_code=str(st.session_state["movers_pick_code"]),
            query_label=q_movers,
        )
        pick_code = st.selectbox(
            "选择一只做深度溯源",
            options=codes,
            key="movers_pick_code",
        )
        pick_row = movers.loc[movers["代码"] == pick_code].iloc[0]
        c1, c2 = st.columns(2)
        with c1:
            if st.button("加入自选股", key="add_mover"):
                kind = str(pick_row.get("类型") or _pick_kind(pick_row.to_dict()))
                yh = str(pick_row.get("Yahoo代码") or pick_row["代码"])
                h = eastmoney.SearchHit(
                    code=str(pick_row["代码"]),
                    name=str(pick_row["名称"]),
                    market=str(pick_row.get("市场") or "A股"),
                    kind=kind,
                    yahoo=yh,
                )
                _add_to_watchlist(h)
                st.success(f"已加入：{pick_row['名称']}（{pick_code}）")
        with c2:
            if st.button("生成行动路线", key="mover_route", type="primary"):
                st.session_state["insight_pick"] = pick_row.to_dict()
                st.session_state["insight_board"] = board
                st.session_state["insight_auto_days"] = 90
                st.session_state["insight_pending"] = True

with tab_panorama:
    st.subheader("全球股市 · 异动全景")
    st.caption(
        "**快速（推荐）**：仅用榜单快照算资金占比与行业归类，10–30 只约 1 秒内完成。"
        "**深度**：仅对选中 1 只拉 K 线/新闻/日内线（约 10–30 秒）。资金占比为模型估计，非真实分单。"
    )
    _show_query_banner("panorama")
    movers_p = st.session_state.get("movers_df")
    if movers_p is None or movers_p.empty:
        st.info("请先在「全球股市」刷新榜单，再回到本页生成分析。")
    else:
        st.write(
            f"当前榜单：{st.session_state.get('movers_market', 'A股')} · "
            f"{st.session_state.get('movers_board', '')} · 共 {len(movers_p)} 只"
        )
        c1, c2 = st.columns([2, 1])
        with c1:
            batch_n = st.slider("快速分析只数", 5, min(30, len(movers_p)), min(15, len(movers_p)))
        with c2:
            st.caption(f"榜单查询：{_query_label('movers') or '—'}")

        if st.button("快速生成异动列表（推荐）", type="primary", use_container_width=True):
            q = _stamp_query("panorama")
            movers_csv = movers_p.to_csv(index=False)
            progress = st.progress(0, text="准备中…")
            progress.progress(0.2, text=f"正在快速分析 {batch_n} 只（榜单快照，无网络）…")
            summaries, details = _cached_panorama_batch(
                movers_csv,
                str(st.session_state.get("movers_market") or "A股"),
                int(batch_n),
                q,
            )
            progress.progress(1.0, text="完成")
            st.session_state["panorama_summary"] = pd.DataFrame(summaries)
            st.session_state["panorama_details"] = [
                panorama_detail_from_dict(d) for d in details
            ]
            st.session_state["panorama_fp"] = _movers_csv_fingerprint(movers_p)
            cluster = build_industry_clusters(summaries)
            st.session_state["panorama_industry_cluster"] = cluster.to_dict("records") if not cluster.empty else []
            progress.empty()
            mark_dirty()
            _save_history(
                log_kind="panorama_fast",
                log_label=f"{st.session_state.get('movers_market')} {st.session_state.get('movers_board')} 异动全景×{batch_n}",
                market=str(st.session_state.get("movers_market") or ""),
                board=str(st.session_state.get("movers_board") or ""),
                count=int(batch_n),
            )

        summary = st.session_state.get("panorama_summary")
        details = [
            panorama_detail_from_dict(d)
            for d in (st.session_state.get("panorama_details") or [])
        ]
        if summary is not None and not summary.empty:
            st.markdown("### 异动列表（快速 · 含资金推测占比）")
            st.dataframe(summary, use_container_width=True, hide_index=True)
            st.caption(
                f"本次分析：{_query_label('panorama') or format_query_datetime()} · "
                f"模式：快速（榜单快照）"
            )

            st.markdown("### 按行业 · 基础市场预期与参考观察")
            cluster = build_industry_clusters(summary.to_dict("records"))
            if not cluster.empty:
                st.dataframe(cluster, use_container_width=True, hide_index=True)

            st.divider()
            st.markdown("### 单只明细 / 深度分析")
            pick_names = [f"{d['name']}（{d['code']}）" for d in details]
            sel_i = st.selectbox("选择标的", range(len(pick_names)), format_func=lambda i: pick_names[i])
            one = details[int(sel_i)]
            deep_intra = st.checkbox("深度含分/时日内线", value=False, key="panorama_deep_intra")

            if st.button("深度分析选中 1 只", type="secondary", use_container_width=True):
                row = movers_p.loc[movers_p["代码"].astype(str) == str(one["code"])].iloc[0].to_dict()
                q = _stamp_query("panorama")
                with st.spinner(f"正在深度分析 {one['name']}（约 10–30 秒）…"):
                    deep_a = analyze_one_mover_deep(
                        row,
                        market=str(st.session_state.get("movers_market") or "A股"),
                        query_label=q,
                        include_intraday=deep_intra,
                    )
                details[int(sel_i)] = {
                    "code": deep_a.code,
                    "name": deep_a.name,
                    "market": deep_a.market,
                    "kind": deep_a.kind,
                    "anomaly_score": deep_a.anomaly_score,
                    "capital": capital_mix_to_dict(deep_a.capital),
                    "timeframes": deep_a.timeframes,
                    "context": deep_a.context,
                    "news": deep_a.news,
                    "snapshot": deep_a.snapshot,
                    "mode": deep_a.mode,
                }
                st.session_state["panorama_details"] = [
                    panorama_detail_from_dict(d) for d in details
                ]
                summary_rows = summary.to_dict("records")
                summary_rows[int(sel_i)] = deep_a.to_summary_dict()
                st.session_state["panorama_summary"] = pd.DataFrame(summary_rows)
                one = st.session_state["panorama_details"][int(sel_i)]
                mark_dirty()
                _save_history(
                    log_kind="panorama_deep",
                    log_label=f"深度分析 {one['name']}（{one['code']}）",
                )
                st.success("深度分析完成，明细已更新。")

            mode_label = "深度" if one.get("mode") == "deep" else "快速"
            st.markdown(
                f"**{one['name']}（{one['code']}）** · {one['market']} · "
                f"异动分 {one['anomaly_score']:.1f} · {mode_label}"
            )
            mix, cap_notes = _capital_mix_for_chart(one.get("capital"))
            fig_pie = go.Figure(
                data=[go.Pie(labels=list(mix.keys()), values=list(mix.values()), hole=0.35)]
            )
            fig_pie.update_layout(title="资金结构推测占比", height=320, margin=dict(t=40, b=10, l=10, r=10))
            st.plotly_chart(fig_pie, use_container_width=True)
            for n in cap_notes:
                st.caption(f"· {n}")

            st.markdown("**多周期变化及对股价影响**")
            st.dataframe(
                pd.DataFrame(slices_to_rows(one["timeframes"])),
                use_container_width=True,
                hide_index=True,
            )
            if one.get("mode") != "deep":
                st.info("当前为快速快照。需要日/周/月 K 线与新闻请点「深度分析选中 1 只」。")

            st.markdown("**时事 / 经营 / 上下游 / 行业**")
            for line in one["context"].get("摘要") or []:
                st.markdown(line)
            st.info(one["context"].get("供应链提示") or "")

            if one.get("news"):
                st.markdown("**相关新闻**")
                for n in one["news"][:8]:
                    t = n.get("标题") or ""
                    link = n.get("链接") or ""
                    if link:
                        st.markdown(f"- [{t}]({link})")
                    else:
                        st.write(f"- {t}")

            if st.button("将此标的载入「异动溯源」", key="panorama_to_insight"):
                st.session_state["insight_pick"] = one["snapshot"]
                st.session_state["insight_board"] = st.session_state.get("movers_board", "")
                st.session_state["insight_auto_days"] = 90
                st.session_state["insight_pending"] = True
                st.success("已载入，请切换到「异动溯源」页。")

with tab_insight:
    st.subheader("异动溯源 · 行动路线")
    st.caption("把「涨跌结果」拆成：过程（量价）→ 原因（新闻/趋势）→ 参与者（资金风格）→ 可能思路（推演）。")
    _show_query_banner("insight", extra=st.session_state.get("insight_range") or "")

    pick = st.session_state.get("insight_pick")
    if not pick:
        st.info("请先在「全球股市」选一只股票并点「生成行动路线」，或在自选股里生成报告。")
    else:
        code = str(pick.get("代码") or "")
        name = str(pick.get("名称") or "")
        st.write(f"当前标的：**{name}（{code}）**　|　市场：{pick.get('市场', '')}")
        st.caption("K 线、财务对比、所属板块请在「自选股 → 行情与分析」查看。")
        if _query_label("insight"):
            st.caption(f"本次报告查询时间：{_query_label('insight')}")
        default_days = int(st.session_state.pop("insight_auto_days", 90))
        days = st.selectbox("分析回看天数", [90, 180, 365], index=[90, 180, 365].index(default_days))
        if st.button("重新生成报告", type="primary") or st.session_state.pop("insight_pending", False):
            _run_insight_report(name=name, code=code, days=days, pick=pick)

    rep = route_report_from_session(st.session_state.get("route_report"))
    if rep:
        st.markdown(f"### {rep.title}")
        st.markdown(f"**一、结果（发生了什么）**  \n{rep.result}")
        st.markdown(f"**二、过程（怎么走出来的）**  \n{rep.process}")
        st.markdown("**三、可能原因（公开信息线索）**")
        for c in rep.causes:
            st.markdown(f"- {c}")
        st.markdown("**四、谁在参与（资金风格推测）**")
        for p in rep.participants:
            st.markdown(f"- {p}")
        st.markdown("**五、行动路线（参与者可能怎么想、怎么做）**")
        for b in rep.playbooks:
            st.markdown(f"- {b}")
        st.markdown("**六、相关新闻**")
        if not rep.news:
            st.write("暂无聚合新闻。")
        else:
            for n in rep.news:
                t = n.get("标题") or ""
                link = n.get("链接") or ""
                src = n.get("来源") or ""
                if link:
                    st.markdown(f"- [{t}]({link})（{src}）")
                else:
                    st.write(f"- {t}（{src}）")
        if _query_label("insight"):
            st.caption(f"本次查询时间：{_query_label('insight')}")
        st.caption(f"数据交叉：{'；'.join(rep.data_sources)}。{rep.disclaimer}")

with tab_history:
    st.subheader("历史记录")
    st.caption(
        f"数据保存在本机 `data/{history_path().name}`，刷新或重新登录后会自动恢复最近一次分析。"
    )
    st.caption(f"文件路径：`{history_path()}`")
    log = st.session_state.get("query_log") or []
    if not log:
        st.info("暂无历史。完成榜单刷新、异动全景或异动溯源后会自动记录。")
    else:
        st.markdown("**快速检索**")
        f1, f2, f3, f4 = st.columns(4)
        dates = unique_dates_from_log(log)
        with f1:
            f_date = st.selectbox("日期", ["全部"] + dates, key="hist_filter_date")
        kinds = sorted({str(e.get("kind") or "") for e in log if e.get("kind")})
        with f2:
            f_kind = st.selectbox(
                "类型",
                ["全部"] + kinds,
                format_func=lambda k: "全部" if k == "全部" else KIND_LABELS.get(k, k),
                key="hist_filter_kind",
            )
        markets = sorted({str(e.get("market") or "") for e in log if e.get("market")})
        with f3:
            f_market = st.selectbox("市场", ["全部"] + markets, key="hist_filter_market")
        stock_opts = unique_stocks_from_log(log)
        with f4:
            f_stock_pick = st.selectbox(
                "股票（可选）",
                ["全部"] + stock_opts[:60],
                key="hist_filter_stock_pick",
            )
        f_stock_kw = st.text_input(
            "股票关键词（代码/名称，与上项可叠加）",
            placeholder="如 920161、英伟达、兆易",
            key="hist_filter_stock_kw",
        )
        stock_kw = f_stock_kw
        if f_stock_pick and f_stock_pick != "全部":
            stock_kw = f"{f_stock_pick} {stock_kw}".strip()

        filtered = filter_query_log(
            log,
            date_key=f_date,
            kind=f_kind,
            market=f_market,
            stock_kw=stock_kw,
        )
        st.caption(f"共 {len(log)} 条记录，筛选后 {len(filtered)} 条")

        if filtered:
            show_rows = [e for _, e in filtered]
            log_df = pd.DataFrame(show_rows)
            show_cols = [
                c
                for c in (
                    "at",
                    "kind",
                    "label",
                    "market",
                    "board",
                    "stocks",
                    "count",
                    "conclusions_summary",
                )
                if c in log_df.columns
            ]
            if "kind" in log_df.columns:
                log_df = log_df.copy()
                log_df["类型"] = log_df["kind"].map(lambda k: KIND_LABELS.get(str(k), k))
                if "类型" in show_cols or "kind" in show_cols:
                    show_cols = ["at", "类型", "label", "market", "stocks", "conclusions_summary"]
                    show_cols = [c for c in show_cols if c in log_df.columns]
            st.dataframe(log_df[show_cols], use_container_width=True, hide_index=True)

            sel = st.selectbox(
                "选择一条历史恢复",
                range(len(filtered)),
                format_func=lambda i: format_log_option(filtered[i][1]),
                key="hist_pick_restore",
            )
            entry = filtered[int(sel)][1]
        else:
            st.warning("没有符合筛选条件的记录，请放宽日期/类型/股票条件。")
            entry = None

        if entry:
            snap = get_snapshot_by_id(str(entry.get("id")))
            if snap:
                st.markdown("**该次分析结论摘要**")
                concl = snap.get("conclusions") or {}
                if concl.get("panorama_headline"):
                    st.write(f"全景龙头：{concl['panorama_headline']}")
                rep_d = concl.get("route_report")
                if rep_d:
                    st.write(f"异动溯源：{rep_d.get('title')} — {str(rep_d.get('result', ''))[:200]}")
                for row in (concl.get("industry_cluster") or [])[:5]:
                    st.caption(
                        f"· {row.get('行业')}：{str(row.get('基础市场预期', ''))[:80]} → {row.get('参考观察（人工判断）', '')}"
                    )
                for note in (concl.get("per_stock_notes") or [])[:5]:
                    st.caption(f"· {note.get('name')}：{note.get('macro_expectation', '')}")

                if st.button("恢复此记录", type="primary", key="history_restore"):
                    restore_snapshot(snap)
                    st.session_state.query_log = load_history().get("query_log", [])
                    st.session_state.history_snapshots = load_history().get("snapshots", [])
                    st.success("已恢复榜单、全景与溯源结论，请切换到对应标签页查看。")
                    st.rerun()
            else:
                st.warning("该条日志没有完整快照（可能为较早版本）。")

    if st.session_state.get("history_restored_label"):
        st.info(f"已从历史恢复：{st.session_state.history_restored_label}")

    concl_live = st.session_state.get("history_conclusions") or {}
    if concl_live and st.session_state.get("_history_restored"):
        with st.expander("当前会话中的已恢复结论", expanded=False):
            if concl_live.get("route_report"):
                rd = concl_live["route_report"]
                st.markdown(f"**{rd.get('title')}**")
                st.write(rd.get("result"))
            if concl_live.get("per_stock_notes"):
                for n in concl_live["per_stock_notes"][:8]:
                    st.caption(f"{n.get('name')}（{n.get('code')}）· {n.get('industry')} · {n.get('macro_expectation', '')}")

if st.session_state.get("_history_dirty"):
    persist_session()

