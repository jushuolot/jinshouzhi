"""
A 股：东方财富搜索建议 + 日/周/月 K 线（HTTP 直连行情接口，与 akshare 同源数据逻辑）。
海外：仍走 Yahoo Finance，列名统一为中文以便展示。
"""

from __future__ import annotations

import json
import re
import time
from datetime import date, timedelta
from typing import Any, Optional

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry

from fetch_stock import fetch_history, resolve_symbol, to_chinese_yfinance_df

EM_SUGGEST_URL = "https://searchadapter.eastmoney.com/api/suggest/get"
EM_TOKEN = "D43BF722C8E33BDC906FB84D85E326E8"
EM_CLIST_URL = "https://push2.eastmoney.com/api/qt/clist/get"
EM_CLIST_FALLBACK = "https://82.push2.eastmoney.com/api/qt/clist/get"
EM_KLINE_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get"
EM_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    ),
    "Referer": "https://quote.eastmoney.com/",
    "Accept": "application/json,text/plain,*/*",
}
# 沪深京 A 股列表（东方财富 clist fs）
EM_A_FS = "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048"

_EM_SESSION: Optional[requests.Session] = None


def _em_session() -> requests.Session:
    """带重试的连接，减轻 RemoteDisconnected。"""
    global _EM_SESSION
    if _EM_SESSION is not None:
        return _EM_SESSION
    s = requests.Session()
    s.headers.update(EM_HEADERS)
    retry = Retry(
        total=5,
        connect=5,
        read=5,
        backoff_factor=0.5,
        status_forcelist=(429, 500, 502, 503, 504),
        allowed_methods=("GET", "POST"),
    )
    ad = HTTPAdapter(max_retries=retry, pool_connections=4, pool_maxsize=8)
    s.mount("https://", ad)
    s.mount("http://", ad)
    _EM_SESSION = s
    return s


def _em_get(url: str, *, params: dict[str, Any], timeout: float = 25) -> requests.Response:
    return _em_session().get(url, params=params, timeout=timeout)


def _code6_to_market_label(code: str) -> str:
    if not code.isdigit() or len(code) != 6:
        return "其他"
    if code[0] == "6":
        return "沪市A股"
    if code[0] in ("0", "3"):
        return "深市A股"
    if code[0] in ("4", "8"):
        return "北交所"
    return "A股"


def normalize_listing_code(raw: str) -> str:
    """统一东方财富返回的证券代码（可能带交易所后缀或前缀）。"""
    r = (raw or "").strip()
    if not r:
        return ""
    up = r.upper()
    for suf in (".SH", ".SZ", ".BJ", ".HK"):
        if up.endswith(suf):
            r = r[: -len(suf)]
            up = r.upper()
    if "." in r and r.replace(".", "").isdigit():
        parts = r.split(".")
        tail = parts[-1]
        if len(tail) == 6 and tail.isdigit():
            return tail
    return r.strip()


def _to_yahoo_ticker(code: str, name_hint: str = "") -> Optional[str]:
    c = normalize_listing_code(code)
    if not c:
        return None
    if c.isdigit() and len(c) == 6:
        if c[0] == "6":
            return f"{c}.SS"
        if c[0] in ("0", "3"):
            return f"{c}.SZ"
        if c[0] in ("4", "8"):
            return f"{c}.BJ"
        return None
    if re.fullmatch(r"[A-Za-z][A-Za-z0-9.\-]*", c) and "." not in c:
        return c.upper()
    if c.isdigit() and len(c) in (4, 5):
        return f"{int(c):04d}.HK"
    if re.fullmatch(r"[A-Za-z.]+", c):
        return c.upper()
    return None


def _parse_suggest_payload(text: str) -> Any:
    t = text.strip()
    if not t:
        return None
    if t.startswith("jQuery") or (t.startswith("(") and t.endswith(");")):
        m = re.search(r"\((\{.*\})\)\s*;?\s*$", t, re.S)
        if m:
            t = m.group(1)
    try:
        return json.loads(t)
    except json.JSONDecodeError:
        return None


def suggest_eastmoney(keyword: str, count: int = 40) -> list[dict[str, Any]]:
    """东方财富搜索建议，返回候选列表（字典）。"""
    kw = (keyword or "").strip()
    if not kw:
        return []
    params = {
        "input": kw,
        "type": "14",
        "token": EM_TOKEN,
        "count": str(count),
    }
    try:
        r = _em_get(EM_SUGGEST_URL, params=params, timeout=12)
        r.raise_for_status()
        payload = _parse_suggest_payload(r.text)
    except Exception:
        return []
    if not isinstance(payload, dict):
        return []
    raw_list = None
    if isinstance(payload.get("Data"), list):
        raw_list = payload["Data"]
    else:
        qct = payload.get("QuotationCodeTable")
        if isinstance(qct, dict) and isinstance(qct.get("Data"), list):
            raw_list = qct["Data"]
    if not raw_list:
        return []
    out: list[dict[str, Any]] = []
    for item in raw_list:
        if not isinstance(item, dict):
            continue
        code_raw = str(item.get("Code") or item.get("code") or "").strip()
        code = normalize_listing_code(code_raw)
        name = str(
            item.get("Name")
            or item.get("ShortName")
            or item.get("name")
            or ""
        ).strip()
        if not code or not name:
            continue
        yh = _to_yahoo_ticker(code, name) or ""
        if code.isdigit() and len(code) == 6:
            kind = "A"
        elif yh.endswith(".HK"):
            kind = "HK"
        elif yh and not code.isdigit():
            kind = "US"
        else:
            kind = "OTHER"
        out.append(
            {
                "代码": code,
                "名称": name,
                "市场": _code6_to_market_label(code) if kind == "A" else ("港股" if kind == "HK" else ("美股" if kind == "US" else "其他")),
                "类型": kind,
                "Yahoo代码": yh,
                "原始": item,
            }
        )
    return out


# 全市场代码表（内存缓存；失败时缓存空表避免反复打接口）
_A_CODE_NAME_DF: Optional[pd.DataFrame] = None


def _clist_fetch_page(base_url: str, page: int, pz: int) -> tuple[list[dict[str, Any]], int]:
    params = {
        "pn": str(page),
        "pz": str(pz),
        "po": "1",
        "np": "1",
        "ut": "bd1d9ddb04089700cf9c27f6f7426281",
        "fltt": "2",
        "invt": "2",
        "fid": "f12",
        "fs": EM_A_FS,
        "fields": "f12,f14",
    }
    for attempt in range(3):
        try:
            r = _em_get(base_url, params=params, timeout=25)
            r.raise_for_status()
            j = r.json()
            data = j.get("data") or {}
            diff = data.get("diff") or []
            total = int(data.get("total") or 0)
            if not isinstance(diff, list):
                diff = []
            return diff, total
        except Exception:
            time.sleep(0.5 * (attempt + 1))
    return [], 0


def _load_a_share_code_name() -> pd.DataFrame:
    """分页拉取沪深京 A 股代码与简称（东方财富 clist）；失败返回空表。"""
    global _A_CODE_NAME_DF
    if _A_CODE_NAME_DF is not None:
        return _A_CODE_NAME_DF

    rows: list[tuple[str, str]] = []
    bases = [EM_CLIST_URL, EM_CLIST_FALLBACK]
    pz = 500
    chosen: Optional[str] = None
    for base in bases:
        try:
            diff0, _total0 = _clist_fetch_page(base, 1, pz)
            if diff0:
                chosen = base
                break
        except Exception:
            continue
    if not chosen:
        return pd.DataFrame(columns=["代码", "名称"])

    try:
        page = 1
        while True:
            diff, total = _clist_fetch_page(chosen, page, pz)
            if not diff:
                break
            for item in diff:
                if not isinstance(item, dict):
                    continue
                raw_c = item.get("f12")
                if raw_c is None:
                    continue
                c = str(raw_c).strip()
                if c.replace(".", "").isdigit() and "." in c:
                    c = c.split(".")[-1]
                c = re.sub(r"\.0$", "", c)
                if not c.isdigit():
                    continue
                c = c.zfill(6)[:6]
                n = str(item.get("f14", "")).strip()
                if len(c) == 6 and n:
                    rows.append((c, n))
            if page * pz >= total or not diff:
                break
            page += 1
            if page > 400:
                break
            time.sleep(0.2)
    except Exception:
        pass

    df = pd.DataFrame(rows, columns=["代码", "名称"]).drop_duplicates(subset=["代码"])
    if df.empty:
        return df
    _A_CODE_NAME_DF = df.astype(str)
    return _A_CODE_NAME_DF


def search_a_share_local(keyword: str, limit: int = 40) -> pd.DataFrame:
    """全 A 名称/代码子串匹配（内存缓存）。clist 不可用时返回空表。"""
    kw = (keyword or "").strip()
    if not kw:
        return pd.DataFrame(columns=["代码", "名称", "市场", "类型", "Yahoo代码"])
    try:
        base = _load_a_share_code_name()
    except Exception:
        return pd.DataFrame(columns=["代码", "名称", "市场", "类型", "Yahoo代码"])
    if base.empty:
        return pd.DataFrame(columns=["代码", "名称", "市场", "类型", "Yahoo代码"])
    m = base["名称"].str.contains(re.escape(kw), case=False, na=False) | base["代码"].astype(
        str
    ).str.startswith(kw)
    sub = base.loc[m].head(limit).copy()
    sub["市场"] = sub["代码"].map(_code6_to_market_label)
    sub["类型"] = "A"
    sub["Yahoo代码"] = sub["代码"].map(lambda c: _to_yahoo_ticker(str(c), "") or "")
    return sub


def search_stocks_fuzzy(keyword: str, limit: int = 40) -> pd.DataFrame:
    """网络建议 + 本地 A 股表合并去重。"""
    em = suggest_eastmoney(keyword, count=limit)
    rows: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for r in em:
        key = (r["代码"], r["名称"])
        if key in seen:
            continue
        seen.add(key)
        rows.append(
            {
                "代码": r["代码"],
                "名称": r["名称"],
                "市场": r["市场"],
                "类型": r["类型"],
                "Yahoo代码": r["Yahoo代码"],
            }
        )
    try:
        local = search_a_share_local(keyword, limit=limit)
    except Exception:
        local = pd.DataFrame()
    for _, row in local.iterrows():
        key = (str(row["代码"]), str(row["名称"]))
        if key in seen:
            continue
        seen.add(key)
        rows.append(row.to_dict())
    return pd.DataFrame(rows)


def period_cn_to_dates(period_label: str, end: date) -> tuple[date, date]:
    """将中文时间范围转为起止日期（闭区间）。"""
    if period_label == "近5日":
        return end - timedelta(days=5), end
    if period_label == "近1个月":
        return end - timedelta(days=31), end
    if period_label == "近3个月":
        return end - timedelta(days=93), end
    if period_label == "近6个月":
        return end - timedelta(days=186), end
    if period_label == "近1年":
        return end - timedelta(days=365), end
    if period_label == "近2年":
        return end - timedelta(days=730), end
    if period_label == "近5年":
        return end - timedelta(days=1825), end
    if period_label == "今年以来":
        return date(end.year, 1, 1), end
    if period_label == "全部":
        return date(1990, 1, 1), end
    return end - timedelta(days=365), end


def _yf_period_token(period_label: str) -> str:
    return {
        "近5日": "5d",
        "近1个月": "1mo",
        "近3个月": "3mo",
        "近6个月": "6mo",
        "近1年": "1y",
        "近2年": "2y",
        "近5年": "5y",
        "今年以来": "ytd",
        "全部": "max",
    }.get(period_label, "1y")


def _kline_cn_to_yf_interval(k: str) -> str:
    return {"日线": "1d", "周线": "1wk", "月线": "1mo"}.get(k, "1d")


def _kline_cn_to_klt(k: str) -> int:
    return {"日线": 101, "周线": 102, "月线": 103}.get(k, 101)


def _candidate_secids(code6: str) -> list[str]:
    """东方财富 secid：沪 1.xxx，深 0.xxx；北交所等尝试多种前缀。"""
    c = str(code6).strip().zfill(6)
    if not c.isdigit() or len(c) != 6:
        return []
    if c[0] == "6" or c.startswith("688") or c.startswith("689"):
        return [f"1.{c}"]
    if c[0] in ("0", "3"):
        return [f"0.{c}"]
    if c[0] in ("4", "8", "9"):
        return [f"0.{c}", f"2.{c}"]
    return [f"0.{c}"]


def _parse_kline_lines(lines: list[str]) -> pd.DataFrame:
    """f51..f61 → 与 akshare.stock_zh_a_hist 接近的中文列。"""
    rows: list[dict[str, Any]] = []
    for line in lines:
        p = line.split(",")
        if len(p) < 7:
            continue
        try:
            rows.append(
                {
                    "日期": p[0],
                    "开盘": float(p[1]),
                    "收盘": float(p[2]),
                    "最高": float(p[3]),
                    "最低": float(p[4]),
                    "成交量": float(p[5]),
                    "成交额": float(p[6]),
                    "振幅": float(p[7]) if len(p) > 7 and p[7] else 0.0,
                    "涨跌幅": float(p[8]) if len(p) > 8 and p[8] else 0.0,
                    "涨跌额": float(p[9]) if len(p) > 9 and p[9] else 0.0,
                    "换手率": float(p[10]) if len(p) > 10 and p[10] else 0.0,
                }
            )
        except (ValueError, TypeError):
            continue
    return pd.DataFrame(rows)


def _fetch_kline_em(secid: str, klt: int, beg: str, end: str) -> list[str]:
    params = {
        "secid": secid,
        "ut": "fa5fd1943c7b386f172d6893fb581867",
        "fields1": "f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13",
        "fields2": "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61",
        "klt": str(klt),
        "fqt": "1",
        "beg": beg,
        "end": end,
        "lmt": "1000000",
    }
    r = _em_get(EM_KLINE_URL, params=params, timeout=25)
    r.raise_for_status()
    j = r.json()
    data = j.get("data") or {}
    klines = data.get("klines")
    if isinstance(klines, list):
        return klines
    return []


def fetch_a_share_hist_cn(
    code6: str,
    *,
    kline_cn: str,
    start: date,
    end: date,
    adjust: str = "qfq",
) -> pd.DataFrame:
    """A 股 K 线（东方财富 HTTP），列名为中文。adjust 暂仅支持 qfq（接口 fqt=1）。"""
    _ = adjust
    klt = _kline_cn_to_klt(kline_cn)
    beg = start.strftime("%Y%m%d")
    ed = end.strftime("%Y%m%d")
    lines: list[str] = []
    last_sec = ""
    for secid in _candidate_secids(code6):
        last_sec = secid
        lines = _fetch_kline_em(secid, klt, beg, ed)
        if lines:
            break
    if not lines:
        raise RuntimeError(f"未获取到 A 股数据：{code6}（secid={last_sec}）。请检查代码或网络。")
    df = _parse_kline_lines(lines)
    if df.empty:
        raise RuntimeError(f"未获取到 A 股数据：{code6}。请检查代码或网络。")
    df = df.copy()
    df["日期"] = pd.to_datetime(df["日期"])
    df["标的代码"] = str(code6).zfill(6)
    df["数据来源"] = "东方财富（HTTP）"
    return df


def fetch_unified(
    selection: dict[str, Any],
    *,
    use_custom_range: bool,
    range_start: date,
    range_end: date,
    period_label: str,
    kline_cn: str,
) -> tuple[pd.DataFrame, str]:
    """
    selection: {类型, 代码, 名称, Yahoo代码}
    返回 (中文列行情表, 说明文案)
    """
    kind = selection.get("类型") or "OTHER"
    name = str(selection.get("名称") or "")
    code = normalize_listing_code(str(selection.get("代码") or ""))
    yh = str(selection.get("Yahoo代码") or "").strip()

    if use_custom_range:
        d0, d1 = range_start, range_end
    else:
        d0, d1 = period_cn_to_dates(period_label, range_end)

    if kind == "A" and code.isdigit() and len(code) == 6:
        df = fetch_a_share_hist_cn(code, kline_cn=kline_cn, start=d0, end=d1, adjust="qfq")
        note = f"A 股 {name}（{code}），东方财富 K 线，前复权。"
        return df, note

    if not yh:
        try:
            yh, _ = resolve_symbol(code or name)
        except ValueError:
            yh = ""
    if not yh:
        raise RuntimeError("无法解析证券代码，请从候选列表重新选择。")
    iv = _kline_cn_to_yf_interval(kline_cn)
    if use_custom_range:
        df = fetch_history(
            yh,
            period=None,
            start=d0.isoformat(),
            end=d1.isoformat(),
            interval=iv,
        )
    else:
        df = fetch_history(
            yh,
            period=_yf_period_token(period_label),
            start=None,
            end=None,
            interval=iv,
        )
    df = to_chinese_yfinance_df(df)
    note = f"{name or yh}（{yh}），Yahoo Finance。"
    return df, note


def row_to_selection(row: Any) -> dict[str, Any]:
    """DataFrame 一行 → fetch_unified 所需 selection。"""
    d = row.to_dict() if hasattr(row, "to_dict") else dict(row)
    return {
        "类型": str(d.get("类型") or "OTHER"),
        "代码": normalize_listing_code(str(d.get("代码") or "")),
        "名称": str(d.get("名称") or ""),
        "Yahoo代码": str(d.get("Yahoo代码") or "").strip(),
    }


def selection_from_yahoo_ticker(yh: str, *, display: str = "") -> dict[str, Any]:
    """仅知道 Yahoo 后缀时推断 A / 港 / 美，便于走东方财富 A 线或 Yahoo。"""
    yh = (yh or "").strip().upper()
    if re.fullmatch(r"\d{6}\.(SZ|SS|BJ)", yh):
        code = yh.split(".")[0]
        return {"类型": "A", "代码": code, "名称": display.strip(), "Yahoo代码": yh}
    if re.fullmatch(r"\d{1,5}\.HK", yh):
        return {"类型": "HK", "代码": yh.split(".")[0], "名称": display.strip(), "Yahoo代码": yh}
    return {"类型": "US", "代码": "", "名称": display.strip(), "Yahoo代码": yh}
