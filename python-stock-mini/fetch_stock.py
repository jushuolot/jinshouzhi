#!/usr/bin/env python3
"""
简易股票日线数据获取：从 Yahoo Finance 拉取历史 K 线并保存为 CSV。

示例:
  python fetch_stock.py --symbol 600519.SS
  python fetch_stock.py --symbol AAPL --period 1y
  python fetch_stock.py --symbol 000001.SZ --start 2024-01-01 --end 2024-12-31
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

import pandas as pd
import yfinance as yf

# 常用中文名 → Yahoo 代码（避免用户输入「苹果」等无法识别）
SYMBOL_ALIASES: dict[str, str] = {
    "苹果": "AAPL",
    "苹果公司": "AAPL",
    "微软": "MSFT",
    "谷歌": "GOOGL",
    "亚马逊": "AMZN",
    "特斯拉": "TSLA",
    "英伟达": "NVDA",
    "茅台": "600519.SS",
    "贵州茅台": "600519.SS",
    "腾讯": "0700.HK",
    "阿里巴巴": "BABA",
    "阿里": "BABA",
    "美团": "3690.HK",
    "比亚迪": "002594.SZ",
    "宁德时代": "300750.SZ",
    "宁德": "300750.SZ",
    "五粮液": "000858.SZ",
    "中国平安": "601318.SS",
    "工行": "601398.SS",
    "工商银行": "601398.SS",
    "中石油": "601857.SS",
    "招商银行": "600036.SS",
}


def _collapse_colon_spaces(s: str) -> str:
    return re.sub(r"\s*:\s*", ":", s.strip())


def _try_parse_exchange_prefix(raw: str) -> tuple[str, str | None] | None:
    """
    聚宽 / Ricequant 等风格：XSHE:300755、XSHG:600519、SH600519 等 → Yahoo 代码。
    成功返回 (yahoo_ticker, hint)；无法识别返回 None。
    """
    t = _collapse_colon_spaces(raw)
    if not t:
        return None
    up = t.upper()

    # SH600519、SZ000001、BJ430047
    m = re.fullmatch(r"(SH|SZ|BJ)(\d{6})", up, re.I)
    if m:
        ex, d6 = m.group(1).upper(), m.group(2)
        if ex == "SH":
            return f"{d6}.SS", f"已识别为沪市 {d6}.SS"
        if ex == "SZ":
            return f"{d6}.SZ", f"已识别为深市 {d6}.SZ"
        if ex == "BJ":
            return f"{d6}.BJ", f"已识别为北交所 {d6}.BJ"

    # XSHE:300755、XSHG:600519、SSE:600519
    m = re.match(
        r"^(XSHG|XSHE|XSSE|SZSE|SHSE|SSE|XBEI|BJSE|NEEQ)[:\.\-\s]+(\d{6})\b",
        up,
        re.I,
    )
    if m:
        prefix, d6 = m.group(1).upper(), m.group(2)
        if prefix in ("XSHE", "SZSE"):
            return f"{d6}.SZ", f"已把「{raw.strip()}」转为 {d6}.SZ（深市）"
        if prefix in ("XSHG", "XSSE", "SHSE", "SSE"):
            return f"{d6}.SS", f"已把「{raw.strip()}」转为 {d6}.SS（沪市）"
        if prefix in ("XBEI", "BJSE", "NEEQ"):
            return f"{d6}.BJ", f"已把「{raw.strip()}」转为 {d6}.BJ（北交所）"

    # 300755.XSHE
    m = re.match(r"^(\d{6})\.(XSHE|XSHG|XBEI|SZSE|SHSE|SSE)$", up, re.I)
    if m:
        d6, suf = m.group(1), m.group(2).upper()
        if suf in ("XSHE", "SZSE"):
            return f"{d6}.SZ", f"已转为 {d6}.SZ"
        if suf in ("XSHG", "SHSE", "SSE"):
            return f"{d6}.SS", f"已转为 {d6}.SS"
        if suf == "XBEI":
            return f"{d6}.BJ", f"已转为 {d6}.BJ"

    return None


def normalize_symbol(raw: str) -> str:
    s = raw.strip().upper()
    if not s:
        raise ValueError("股票代码不能为空")
    return s


def resolve_symbol(raw: str) -> tuple[str, str | None]:
    """
    把用户输入解析为 Yahoo 代码。
    返回 (代码, 提示文案)；无别名/自动补全时提示为 None。
    """
    key = raw.strip()
    if not key:
        raise ValueError("股票代码不能为空")
    ex = _try_parse_exchange_prefix(key)
    if ex is not None:
        return ex
    if key in SYMBOL_ALIASES:
        y = SYMBOL_ALIASES[key]
        return y, f"已将「{key}」对应为 Yahoo 代码 {y}"
    if key.isdigit() and len(key) == 6:
        first = key[0]
        if first == "6":
            y = f"{key}.SS"
            return y, f"已自动补全为 {y}（沪市）"
        if first in ("0", "3"):
            y = f"{key}.SZ"
            return y, f"已自动补全为 {y}（深市）"
        if first in ("4", "8"):
            y = f"{key}.BJ"
            return y, f"已自动补全为 {y}（北交所；若无效请改用手动后缀）"
    return normalize_symbol(key), None


def to_chinese_yfinance_df(df: pd.DataFrame) -> pd.DataFrame:
    """将 Yahoo 返回的英文列名转为中文，便于与 A 股表头一致展示。"""
    out = df.copy()
    mapping = {
        "Date": "日期",
        "Open": "开盘",
        "High": "最高",
        "Low": "最低",
        "Close": "收盘",
        "Adj Close": "复权收盘",
        "Volume": "成交量",
        "Dividends": "分红",
        "Stock Splits": "拆并股",
        "Symbol": "标的代码",
    }
    out = out.rename(columns={k: v for k, v in mapping.items() if k in out.columns})
    if "日期" in out.columns:
        out["日期"] = pd.to_datetime(out["日期"])
    if "数据来源" not in out.columns:
        out["数据来源"] = "Yahoo Finance"
    return out


def fetch_history(
    symbol: str,
    *,
    period: str | None,
    start: str | None,
    end: str | None,
    interval: str,
) -> pd.DataFrame:
    ticker = yf.Ticker(symbol)
    if start or end:
        df = ticker.history(start=start, end=end, interval=interval, auto_adjust=False)
    else:
        df = ticker.history(period=period or "6mo", interval=interval, auto_adjust=False)
    if df.empty:
        raise RuntimeError(
            f"未获取到行情数据（{symbol}）。可换一个关键词点「搜索候选」后选择证券，"
            f"或检查网络后重试。"
        )
    df = df.rename_axis("Date").reset_index()
    df["Symbol"] = symbol
    return df


def main() -> int:
    parser = argparse.ArgumentParser(description="拉取股票历史行情并导出 CSV")
    parser.add_argument(
        "--symbol",
        "-s",
        required=True,
        help="Yahoo 代码。A股示例: 600519.SS, 000001.SZ；美股: AAPL",
    )
    parser.add_argument(
        "--period",
        "-p",
        default="1y",
        help="与 Yahoo 一致: 1d,5d,1mo,3mo,6mo,1y,2y,5y,ytd,max（若指定 --start/--end 则忽略）",
    )
    parser.add_argument("--start", help="起始日期 YYYY-MM-DD")
    parser.add_argument("--end", help="结束日期 YYYY-MM-DD（不含当日可留空）")
    parser.add_argument(
        "--interval",
        "-i",
        default="1d",
        choices=["1d", "1wk", "1mo"],
        help="K线周期",
    )
    parser.add_argument(
        "--out",
        "-o",
        type=Path,
        help="输出 CSV 路径，默认写入 ./data/<symbol>.csv",
    )
    args = parser.parse_args()

    try:
        symbol, _hint = resolve_symbol(args.symbol)
    except ValueError as e:
        print(e, file=sys.stderr)
        return 2

    out_path = args.out
    if out_path is None:
        data_dir = Path(__file__).resolve().parent / "data"
        data_dir.mkdir(parents=True, exist_ok=True)
        safe_name = symbol.replace(".", "_")
        out_path = data_dir / f"{safe_name}.csv"

    try:
        df = fetch_history(
            symbol,
            period=args.period if not (args.start or args.end) else None,
            start=args.start,
            end=args.end,
            interval=args.interval,
        )
    except Exception as e:
        print(f"获取失败: {e}", file=sys.stderr)
        return 1

    out_path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(out_path, index=False, encoding="utf-8-sig")
    print(f"已保存 {len(df)} 行 -> {out_path}")
    print(df.tail(3).to_string(index=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
