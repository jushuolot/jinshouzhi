"""统一行情入口：多源拉取 + 自动降级，降低对单一站点依赖。"""

from __future__ import annotations

from datetime import date

import pandas as pd

from src.providers import eastmoney, sina, yahoo
from src.providers import yahoo_ranking
from src.providers.ticker_util import is_bj_code, yahoo_ticker_a


def fetch_global_ranking_multi(
    *,
    market: str = "A股",
    board: str = "涨幅榜",
    limit: int = 50,
) -> tuple[pd.DataFrame, str]:
    """全球榜单：A 股东财→新浪；港股/美股 Yahoo。"""
    m = (market or "A股").strip()
    if m in ("A股", "沪深京", "A"):
        return fetch_a_ranking_multi(board=board, limit=limit)
    if m in ("港股", "HK"):
        df = yahoo_ranking.fetch_ranking(region="HK", board=board, limit=limit)
        if not df.empty:
            return df, "Yahoo Finance（港股）"
        return df, "无可用数据源"
    if m in ("美股", "US"):
        df = yahoo_ranking.fetch_ranking(region="US", board=board, limit=limit)
        if not df.empty:
            return df, "Yahoo Finance（美股）"
        return df, "无可用数据源"
    return fetch_a_ranking_multi(board=board, limit=limit)


def fetch_a_ranking_multi(*, board: str = "涨幅榜", limit: int = 50) -> tuple[pd.DataFrame, str]:
    """A 股榜单：东财 → 新浪 依次尝试。"""
    df = eastmoney.fetch_a_ranking(board=board, limit=limit)
    if not df.empty:
        if "数据来源" not in df.columns:
            df["数据来源"] = "东方财富"
        if "类型" not in df.columns:
            df["类型"] = "A"
        return df, "东方财富"
    df = sina.fetch_a_ranking(board=board, limit=limit)
    if not df.empty:
        if "类型" not in df.columns:
            df["类型"] = "A"
        return df, "新浪财经（东财不可用时的备用）"
    return df, "无可用数据源"


def fetch_kline_multi(
    *,
    kind: str,
    code: str,
    kline: str,
    start: date,
    end: date,
) -> tuple[pd.DataFrame, str]:
    code = (code or "").strip()
    if kind == "A" and code.isdigit() and len(code) == 6:
        try:
            df = eastmoney.fetch_a_kline(code, kline=kline, start=start, end=end)
            src = str(df.iloc[0].get("数据来源", "东方财富")) if not df.empty else "东方财富"
            return df, src
        except Exception as em_err:
            yh = yahoo_ticker_a(code)
            if is_bj_code(code):
                raise RuntimeError(
                    f"北交所 {code} 行情暂不可用（东方财富：{em_err}）。"
                    f"Yahoo 对 {yh} 通常也无历史数据，请稍后重试或先分析沪深股票。"
                ) from em_err
            iv_map = {
                "日线": "1d",
                "日K": "1d",
                "周线": "1wk",
                "周K": "1wk",
                "月线": "1mo",
                "月K": "1mo",
            }
            if eastmoney.is_intraday_kline(kline):
                raise RuntimeError(
                    f"分钟级 K 线（{kline}）仅支持沪深京 A 股东方财富接口；{code} 东财失败且无分钟备用源。"
                ) from em_err
            iv = iv_map.get(kline, "1d")
            try:
                df = yahoo.fetch_history(yh, start=start, end=end, interval=iv)
            except Exception as yh_err:
                raise RuntimeError(
                    f"未获取到 {code} 行情（东财与 Yahoo 均失败）。东财：{em_err}；Yahoo({yh})：{yh_err}"
                ) from yh_err
            return df, f"Yahoo Finance（东财失败）"

    iv_map = {
        "日线": "1d",
        "日K": "1d",
        "周线": "1wk",
        "周K": "1wk",
        "月线": "1mo",
        "月K": "1mo",
    }
    iv = iv_map.get(kline, "1d")
    df = yahoo.fetch_history(code, start=start, end=end, interval=iv)
    return df, "Yahoo Finance"
