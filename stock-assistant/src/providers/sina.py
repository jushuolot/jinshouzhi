"""新浪财经公开接口（A 股榜单/行情），作为东方财富的备用源。"""

from __future__ import annotations

import re
from typing import Any

import pandas as pd
import requests

from src.providers.ticker_util import a_market_label, yahoo_ticker_a

_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Referer": "https://finance.sina.com.cn/",
}
_LIST_URL = "http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHQNodeData"


def _to_code6(symbol: str) -> str:
    s = (symbol or "").strip().lower()
    m = re.search(r"(?:sh|sz|bj)(\d{6})", s)
    if m:
        return m.group(1)
    if s.isdigit():
        return s.zfill(6)[:6]
    return s


def _market_label(code6: str) -> str:
    return a_market_label(code6)


def fetch_a_ranking(*, board: str = "涨幅榜", limit: int = 50) -> pd.DataFrame:
    sort = "changepercent"
    asc = 0
    if board == "跌幅榜":
        asc = 1
    elif board == "成交额榜":
        sort, asc = "amount", 0
    elif board == "换手率榜":
        sort, asc = "turnoverratio", 0

    params = {"page": "1", "num": str(limit), "sort": sort, "asc": str(asc), "node": "hs_a"}
    try:
        r = requests.get(_LIST_URL, params=params, headers=_HEADERS, timeout=20)
        r.raise_for_status()
        data = r.json()
    except Exception:
        return pd.DataFrame()

    if not isinstance(data, list):
        return pd.DataFrame()

    rows: list[dict[str, Any]] = []
    for item in data:
        if not isinstance(item, dict):
            continue
        code = _to_code6(str(item.get("symbol") or item.get("code") or ""))
        name = str(item.get("name") or "").strip()
        if len(code) != 6 or not name:
            continue
        def _f(k: str) -> float | None:
            try:
                return float(item.get(k))
            except (TypeError, ValueError):
                return None

        rows.append(
            {
                "代码": code,
                "名称": name,
                "市场": _market_label(code),
                "类型": "A",
                "最新价": _f("trade"),
                "涨跌幅%": _f("changepercent"),
                "涨跌额": _f("pricechange"),
                "成交量": _f("volume"),
                "成交额": _f("amount"),
                "振幅%": _f("swing"),
                "换手率%": _f("turnoverratio"),
                "Yahoo代码": yahoo_ticker_a(code),
                "数据来源": "新浪财经",
            }
        )
    return pd.DataFrame(rows)
