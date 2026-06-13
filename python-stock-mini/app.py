"""
浏览器中使用：先登录 → 关键词搜索证券 → 选一条 → 拉取行情。
密码：`.streamlit/secrets.toml` 中的 STOCK_APP_PASSWORD，或环境变量同名。
启动：双击「启动股票页面.command」或 `streamlit run app.py`。
"""

from __future__ import annotations

import io
import os
from datetime import date

import pandas as pd
import streamlit as st

from cn_market import (
    fetch_unified,
    row_to_selection,
    search_stocks_fuzzy,
    selection_from_yahoo_ticker,
)
from fetch_stock import resolve_symbol


def _get_login_password() -> str | None:
    """优先 Streamlit secrets，其次环境变量 STOCK_APP_PASSWORD。"""
    try:
        p = st.secrets.get("STOCK_APP_PASSWORD")
        if p is not None and str(p).strip():
            return str(p).strip()
    except Exception:
        pass
    v = os.environ.get("STOCK_APP_PASSWORD", "").strip()
    return v or None


def _render_login_page() -> None:
    st.title("访问验证")
    expected = _get_login_password()
    if not expected:
        st.error(
            "尚未配置访问密码。请任选一种方式后**重启** Streamlit：\n\n"
            "1. 将 `.streamlit/secrets.toml.example` 复制为 `.streamlit/secrets.toml`，"
            "把 `STOCK_APP_PASSWORD` 改成你的强密码；\n"
            "2. 或在终端执行：`export STOCK_APP_PASSWORD='你的强密码'` 再启动。"
        )
        st.caption("示例 secrets 文件内容：")
        st.code('STOCK_APP_PASSWORD = "你的强密码"', language="toml")
        return
    c1, c2, c3 = st.columns([1, 2, 1])
    with c2:
        with st.form("login_form", clear_on_submit=False):
            pw = st.text_input("访问密码", type="password", autocomplete="current-password")
            submitted = st.form_submit_button("登录", type="primary", use_container_width=True)
        if submitted:
            if pw == expected:
                st.session_state["_stock_auth_ok"] = True
                st.rerun()
            else:
                st.error("密码错误，请重试。")


st.set_page_config(page_title="股票行情查询", layout="wide")

if "_stock_auth_ok" not in st.session_state:
    st.session_state["_stock_auth_ok"] = False

if not st.session_state["_stock_auth_ok"]:
    _render_login_page()
    st.stop()

st.title("股票行情查询")
st.caption(
    "支持**随意关键词**：代码、简称片段、拼音、**XSHE:300755**、**SH600519** 等；"
    "A 股日线来自东方财富，海外标的来自 Yahoo。"
)

if "df" not in st.session_state:
    st.session_state.df = None
if "note" not in st.session_state:
    st.session_state.note = ""
if "hits" not in st.session_state:
    st.session_state.hits = None
if "pick_i" not in st.session_state:
    st.session_state.pick_i = 0

PERIOD_OPTIONS = [
    "近5日",
    "近1个月",
    "近3个月",
    "近6个月",
    "近1年",
    "近2年",
    "近5年",
    "今年以来",
    "全部",
]
KLINE_OPTIONS = ["日线", "周线", "月线"]

with st.sidebar:
    if st.button("退出登录", use_container_width=True):
        st.session_state["_stock_auth_ok"] = False
        st.rerun()
    st.divider()
    st.header("查询条件")
    keyword = st.text_input(
        "关键词",
        value="茅台",
        help="可输入：公司简称、代码片段、XSHE:300755、SH600519、AAPL 等",
    )
    if st.button("搜索候选", use_container_width=True):
        with st.spinner("正在搜索…"):
            st.session_state.hits = search_stocks_fuzzy(keyword.strip(), limit=30)
            st.session_state.pick_i = 0

    hits = st.session_state.hits
    pick_i = 0
    if hits is not None and not hits.empty:
        labels = [f"{r['代码']}  {r['名称']}  ({r['市场']})" for _, r in hits.iterrows()]
        pick_i = st.selectbox("在候选中选择", range(len(labels)), format_func=lambda i: labels[i])
        st.session_state.pick_i = pick_i
    elif hits is not None and hits.empty:
        st.warning("未搜到候选，可直接点「拉取行情」尝试把整句当作代码解析。")

    use_range = st.checkbox("自定义日期区间", value=False)
    period_label = st.selectbox("时间范围", options=PERIOD_OPTIONS, index=4)
    kline_cn = st.selectbox("K 线周期", options=KLINE_OPTIONS, index=0)
    col_a, col_b = st.columns(2)
    with col_a:
        range_start = st.date_input("开始日期", value=date(2024, 1, 1), disabled=not use_range)
    with col_b:
        range_end = st.date_input("结束日期", value=date.today(), disabled=not use_range)

    run = st.button("拉取行情", type="primary", use_container_width=True)

if run:
    kw = keyword.strip()
    if not kw:
        st.error("请先输入关键词。")
    else:
        sel = None
        hits = st.session_state.hits
        if hits is not None and not hits.empty:
            sel = row_to_selection(hits.iloc[st.session_state.pick_i])
        else:
            try:
                yh, hint = resolve_symbol(kw)
                sel = selection_from_yahoo_ticker(yh, display=kw)
            except ValueError as e:
                st.error(str(e))
                sel = None
            else:
                if hint:
                    st.info(hint)
        if sel is not None:
            with st.spinner("正在拉取行情…"):
                try:
                    df, note = fetch_unified(
                        sel,
                        use_custom_range=use_range,
                        range_start=range_start,
                        range_end=range_end,
                        period_label=period_label,
                        kline_cn=kline_cn,
                    )
                except Exception as e:
                    st.error(f"获取失败：{e}")
                    st.session_state.df = None
                    st.session_state.note = ""
                else:
                    st.session_state.df = df
                    st.session_state.note = note
                    st.success(note + f"（共 {len(df)} 条）")

df = st.session_state.df

if df is not None and not df.empty:
    st.subheader("行情走势（开盘—收盘区间）")
    cdf = df.copy()
    if "日期" in cdf.columns:
        cdf["日期"] = pd.to_datetime(cdf["日期"])
        cdf = cdf.set_index("日期")[["开盘", "最高", "最低", "收盘"]]
        st.line_chart(cdf)
    elif "Date" in df.columns:
        cdf = df.copy()
        cdf["Date"] = pd.to_datetime(cdf["Date"])
        cdf = cdf.set_index("Date")[["Open", "High", "Low", "Close"]]
        st.line_chart(cdf)

    st.subheader("数据表（可直接编辑）")
    edited = st.data_editor(df, use_container_width=True, hide_index=True)

    tag = (
        str(df.iloc[0].get("标的代码", ""))
        or str(df.iloc[0].get("代码", ""))
        or "export"
    ).replace(".", "_")
    buf = io.StringIO()
    edited.to_csv(buf, index=False, encoding="utf-8-sig")
    st.download_button(
        label="下载 CSV（Excel 可打开）",
        data=buf.getvalue().encode("utf-8-sig"),
        file_name=f"{tag}.csv",
        mime="text/csv",
        type="secondary",
    )
else:
    st.info("左侧输入关键词 → 点「搜索候选」选证券 → 点「拉取行情」。也可不搜索，直接「拉取行情」尝试自动解析。")
