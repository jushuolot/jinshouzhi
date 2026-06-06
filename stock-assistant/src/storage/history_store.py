"""本地历史：data/user_history.json（已 gitignore）。"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd
import streamlit as st

from src.analysis.industry_recommend import build_industry_clusters
from src.analysis.mover_insight import ActionRouteReport
from src.storage.serialize import (
    df_to_records,
    panorama_detail_from_dict,
    panorama_detail_to_dict,
    records_to_df,
    route_report_from_session,
    route_report_to_dict,
)

_HISTORY_VERSION = 5
_MAX_LOG = 50
_MAX_SNAPSHOTS = 20

KIND_LABELS: dict[str, str] = {
    "movers": "刷新榜单",
    "panorama_fast": "异动全景·快速",
    "panorama_deep": "异动全景·深度",
    "insight": "异动溯源",
    "watchlist": "自选股",
}


from src.storage.paths import history_file_path

try:
    from src.auth.users import current_user_id
except Exception:
    def current_user_id() -> str:  # type: ignore[misc]
        return "default"


def history_path() -> Path:
    try:
        uid = current_user_id()
    except Exception:
        uid = "default"
    return history_file_path(user_id=uid)


def _empty_store() -> dict[str, Any]:
    return {
        "version": _HISTORY_VERSION,
        "watchlist": [],
        "latest": {},
        "query_log": [],
        "snapshots": [],
    }


def load_history() -> dict[str, Any]:
    path = history_path()
    if not path.exists():
        return _empty_store()
    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            return _empty_store()
        data.setdefault("watchlist", [])
        data.setdefault("latest", {})
        data.setdefault("query_log", [])
        data.setdefault("snapshots", [])
        return data
    except (json.JSONDecodeError, OSError):
        return _empty_store()


def save_history(data: dict[str, Any]) -> None:
    path = history_path()
    data["version"] = _HISTORY_VERSION
    tmp = path.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    tmp.replace(path)


def _iso_ts(val: Any) -> str | None:
    if val is None:
        return None
    if isinstance(val, datetime):
        return val.isoformat()
    return str(val)


def build_per_stock_notes(details: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for d in details:
        ctx = d.get("context") or {}
        if isinstance(ctx, dict):
            lines = ctx.get("摘要") or []
            if isinstance(lines, list):
                summary_lines = [str(x) for x in lines[:6]]
            else:
                summary_lines = []
            out.append(
                {
                    "code": d.get("code"),
                    "name": d.get("name"),
                    "industry": ctx.get("行业"),
                    "macro_expectation": ctx.get("宏观预期"),
                    "summary_lines": summary_lines,
                }
            )
    return out


def build_conclusions_from_session() -> dict[str, Any]:
    """从当前 session 组装分析结论包。"""
    rep = route_report_from_session(st.session_state.get("route_report"))
    route_d = route_report_to_dict(rep) if rep else None

    summary = st.session_state.get("panorama_summary")
    records = summary.to_dict("records") if isinstance(summary, pd.DataFrame) and not summary.empty else []
    cluster_df = build_industry_clusters(records) if records else pd.DataFrame()
    cluster = cluster_df.to_dict("records") if not cluster_df.empty else []

    details_raw = st.session_state.get("panorama_details") or []
    details_live = [panorama_detail_from_dict(d) for d in details_raw]
    per_stock = build_per_stock_notes(details_live)

    headline = ""
    if records:
        top = sorted(records, key=lambda x: float(x.get("异动分") or 0), reverse=True)[:3]
        headline = "；".join(f"{r.get('名称')}({r.get('代码')})" for r in top if r.get("代码"))

    return {
        "route_report": route_d,
        "industry_cluster": cluster,
        "panorama_headline": headline,
        "per_stock_notes": per_stock,
    }


def log_date_key(at: str | None) -> str:
    """从 at 字段取日期：2026年06月05日 01:24:08 → 2026年06月05日"""
    s = str(at or "").strip()
    if "日" in s:
        return s.split("日", 1)[0] + "日"
    return s[:10] if len(s) >= 10 else s


def collect_stock_hints_from_session() -> str:
    """当前会话涉及的股票名称/代码，逗号分隔，供历史检索。"""
    hints: list[str] = []
    pick = st.session_state.get("insight_pick")
    if isinstance(pick, dict):
        for k in ("名称", "代码"):
            v = str(pick.get(k) or "").strip()
            if v and v.lower() != "nan":
                hints.append(v)
    code = st.session_state.get("movers_pick_code")
    if code:
        hints.append(str(code).strip())
    movers = st.session_state.get("movers_df")
    if isinstance(movers, pd.DataFrame) and not movers.empty:
        for col in ("代码", "名称"):
            if col in movers.columns:
                for v in movers[col].astype(str).head(20):
                    v = str(v).strip()
                    if v and v.lower() != "nan" and v not in hints:
                        hints.append(v)
    details = st.session_state.get("panorama_details") or []
    for d in details[:15]:
        if isinstance(d, dict):
            for k in ("code", "name", "代码", "名称"):
                v = str(d.get(k) or "").strip()
                if v and v.lower() != "nan" and v not in hints:
                    hints.append(v)
    seen: set[str] = set()
    out: list[str] = []
    for h in hints:
        if h not in seen:
            seen.add(h)
            out.append(h)
    return ",".join(out[:40])


def entry_search_text(entry: dict[str, Any]) -> str:
    parts = [
        str(entry.get("label") or ""),
        str(entry.get("conclusions_summary") or ""),
        str(entry.get("stocks") or ""),
        str(entry.get("market") or ""),
        str(entry.get("board") or ""),
    ]
    return " ".join(parts).lower()


def unique_dates_from_log(log: list[dict[str, Any]]) -> list[str]:
    dates = {log_date_key(e.get("at")) for e in log if e.get("at")}
    return sorted(dates, reverse=True)


def unique_stocks_from_log(log: list[dict[str, Any]]) -> list[str]:
    found: list[str] = []
    seen: set[str] = set()
    for e in log:
        raw = str(e.get("stocks") or "")
        if raw:
            for s in raw.split(","):
                s = s.strip()
                if s and s not in seen:
                    seen.add(s)
                    found.append(s)
        hay = str(e.get("label") or "") + str(e.get("conclusions_summary") or "")
        for m in re.findall(r"([\u4e00-\u9fffA-Za-z·]{2,12})[（(]([A-Za-z0-9.]{2,12})[）)]", hay):
            name, code = m[0].strip(), m[1].strip()
            for token in (name, code):
                if token and token not in seen:
                    seen.add(token)
                    found.append(token)
        for code in re.findall(r"\b\d{6}\b", hay):
            if code not in seen:
                seen.add(code)
                found.append(code)
    return found[:80]


def filter_query_log(
    log: list[dict[str, Any]],
    *,
    date_key: str = "全部",
    kind: str = "全部",
    market: str = "全部",
    stock_kw: str = "",
) -> list[tuple[int, dict[str, Any]]]:
    """返回 (原列表下标, entry) 的筛选结果。"""
    kw = (stock_kw or "").strip().lower()
    out: list[tuple[int, dict[str, Any]]] = []
    for i, e in enumerate(log):
        if date_key and date_key != "全部" and log_date_key(e.get("at")) != date_key:
            continue
        if kind and kind != "全部" and str(e.get("kind") or "") != kind:
            continue
        if market and market != "全部" and str(e.get("market") or "") != market:
            continue
        if kw and kw not in entry_search_text(e):
            continue
        out.append((i, e))
    return out


def format_log_option(entry: dict[str, Any]) -> str:
    kind_cn = KIND_LABELS.get(str(entry.get("kind") or ""), entry.get("kind") or "")
    summary = str(entry.get("conclusions_summary") or "")[:55]
    stocks = str(entry.get("stocks") or "")[:30]
    extra = f" | {stocks}" if stocks else ""
    return f"{entry.get('at')} | {kind_cn} | {entry.get('label')}{extra} | {summary}"


def conclusions_summary_line(*, kind: str, conclusions: dict[str, Any], extra: str = "") -> str:
    parts: list[str] = []
    rep = conclusions.get("route_report")
    if rep and isinstance(rep, dict):
        r = str(rep.get("result") or rep.get("title") or "")[:100]
        if r:
            parts.append(f"溯源:{r}")
    headline = conclusions.get("panorama_headline")
    if headline:
        parts.append(f"全景龙头:{headline[:80]}")
    cluster = conclusions.get("industry_cluster") or []
    if cluster:
        inds = "、".join(str(c.get("行业") or "") for c in cluster[:3])
        parts.append(f"行业{len(cluster)}组({inds})")
    if extra:
        parts.append(extra)
    return " · ".join(parts) if parts else (extra or kind)


def _collect_brief_archive() -> dict[str, str]:
    out: dict[str, str] = {}
    for key, val in st.session_state.items():
        sk = str(key)
        if sk.startswith("brief_md_") and isinstance(val, str) and val.strip():
            out[sk] = val
    return out


def _apply_brief_archive(archive: dict[str, Any] | None) -> None:
    if not archive:
        return
    for key, val in archive.items():
        if str(key).startswith("brief_md_") and isinstance(val, str):
            st.session_state[str(key)] = val


def collect_latest_state() -> dict[str, Any]:
    labels: dict[str, str | None] = {}
    for scope in ("movers", "panorama", "insight", "watch", "search"):
        labels[scope] = _iso_ts(st.session_state.get(f"query_at_{scope}"))

    movers = st.session_state.get("movers_df")
    summary = st.session_state.get("panorama_summary")
    details = st.session_state.get("panorama_details") or []

    conclusions = build_conclusions_from_session()
    cluster = conclusions.get("industry_cluster") or []

    return {
        "movers_records": df_to_records(movers if isinstance(movers, pd.DataFrame) else None),
        "movers_market": st.session_state.get("movers_market"),
        "movers_board": st.session_state.get("movers_board"),
        "movers_src": st.session_state.get("movers_src"),
        "movers_pick_code": st.session_state.get("movers_pick_code"),
        "panorama_summary": df_to_records(summary if isinstance(summary, pd.DataFrame) else None),
        "panorama_details": [panorama_detail_to_dict(d) for d in details],
        "panorama_industry_cluster": cluster,
        "insight_pick": st.session_state.get("insight_pick"),
        "route_report": conclusions.get("route_report"),
        "insight_range": st.session_state.get("insight_range"),
        "insight_board": st.session_state.get("insight_board"),
        "query_labels": labels,
        "conclusions": conclusions,
        "watch_snapshots": dict(st.session_state.get("watch_snapshots") or {}),
        "brief_archive": _collect_brief_archive(),
        "user_prefs": {
            "auto_refresh_enabled": bool(st.session_state.get("auto_refresh_enabled")),
            "auto_refresh_minutes": int(st.session_state.get("auto_refresh_minutes") or 5),
            "push_webhook_on_refresh": bool(st.session_state.get("push_webhook_on_refresh")),
            "push_email_on_refresh": bool(st.session_state.get("push_email_on_refresh")),
        },
    }


def apply_latest_to_session(latest: dict[str, Any]) -> None:
    if not latest:
        return
    movers_df = records_to_df(latest.get("movers_records"))
    if movers_df is not None:
        st.session_state["movers_df"] = movers_df
    for key in ("movers_market", "movers_board", "movers_src", "insight_pick", "insight_range", "insight_board"):
        if latest.get(key) is not None:
            st.session_state[key] = latest[key]
    if latest.get("movers_pick_code") is not None:
        st.session_state["_pending_movers_pick_code"] = latest["movers_pick_code"]

    ps = records_to_df(latest.get("panorama_summary"))
    if ps is not None:
        st.session_state["panorama_summary"] = ps
    pdetails = latest.get("panorama_details") or []
    if pdetails:
        st.session_state["panorama_details"] = [panorama_detail_from_dict(d) for d in pdetails]
    if latest.get("panorama_industry_cluster"):
        st.session_state["panorama_industry_cluster"] = latest["panorama_industry_cluster"]

    rep_d = latest.get("route_report")
    if rep_d:
        st.session_state["route_report"] = ActionRouteReport.from_dict(rep_d)
    elif (latest.get("conclusions") or {}).get("route_report"):
        st.session_state["route_report"] = ActionRouteReport.from_dict(latest["conclusions"]["route_report"])

    ql = latest.get("query_labels") or {}
    for scope, iso in ql.items():
        if iso:
            try:
                st.session_state[f"query_at_{scope}"] = datetime.fromisoformat(iso)
                st.session_state[f"query_label_{scope}"] = iso.replace("T", " ")[:19]
            except ValueError:
                pass
    if ql.get("movers") or ql.get("panorama"):
        st.session_state["query_at_latest"] = st.session_state.get("query_at_panorama") or st.session_state.get("query_at_movers")

    if latest.get("watch_snapshots"):
        st.session_state.watch_snapshots = dict(latest["watch_snapshots"])
    _apply_brief_archive(latest.get("brief_archive"))

    prefs = latest.get("user_prefs") or {}
    if "auto_refresh_enabled" in prefs:
        st.session_state.auto_refresh_enabled = bool(prefs["auto_refresh_enabled"])
    if prefs.get("auto_refresh_minutes") is not None:
        st.session_state.auto_refresh_minutes = int(prefs["auto_refresh_minutes"])
    if "push_webhook_on_refresh" in prefs:
        st.session_state.push_webhook_on_refresh = bool(prefs["push_webhook_on_refresh"])
    if "push_email_on_refresh" in prefs:
        st.session_state.push_email_on_refresh = bool(prefs["push_email_on_refresh"])

    st.session_state["history_conclusions"] = latest.get("conclusions") or {}


def restore_snapshot(snapshot: dict[str, Any]) -> None:
    state = snapshot.get("state") or snapshot
    apply_latest_to_session(state)
    st.session_state["history_conclusions"] = snapshot.get("conclusions") or state.get("conclusions") or {}
    st.session_state["history_restored_label"] = snapshot.get("label") or snapshot.get("saved_at") or ""


def append_query_log(
    *,
    kind: str,
    label: str,
    market: str = "",
    board: str = "",
    count: int = 0,
    conclusions_summary: str = "",
    push_snapshot: bool = True,
) -> None:
    store = load_history()
    log = store.setdefault("query_log", [])
    entry_id = str(uuid.uuid4())[:8]
    at = datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")
    conclusions = build_conclusions_from_session()
    summary = conclusions_summary or conclusions_summary_line(kind=kind, conclusions=conclusions, extra=label)

    entry = {
        "id": entry_id,
        "at": at,
        "date_key": log_date_key(at),
        "kind": kind,
        "label": label,
        "market": market,
        "board": board,
        "count": count,
        "stocks": collect_stock_hints_from_session(),
        "conclusions_summary": summary,
    }
    log.insert(0, entry)
    store["query_log"] = log[:_MAX_LOG]

    store["watchlist"] = st.session_state.get("watchlist", [])
    store["latest"] = collect_latest_state()

    if push_snapshot:
        snap = {
            "id": entry_id,
            "saved_at": at,
            "label": label,
            "kind": kind,
            "state": store["latest"],
            "conclusions": conclusions,
        }
        snaps = store.setdefault("snapshots", [])
        snaps.insert(0, snap)
        store["snapshots"] = snaps[:_MAX_SNAPSHOTS]

    save_history(store)


def persist_session(*, log_kind: str | None = None, log_label: str = "", **log_kw: Any) -> None:
    store = load_history()
    store["watchlist"] = st.session_state.get("watchlist", [])
    store["latest"] = collect_latest_state()
    if log_kind:
        conclusions = build_conclusions_from_session()
        summary = log_kw.pop("conclusions_summary", "") or conclusions_summary_line(
            kind=log_kind, conclusions=conclusions, extra=log_label
        )
        log = store.setdefault("query_log", [])
        at = datetime.now().strftime("%Y年%m月%d日 %H:%M:%S")
        entry = {
            "id": str(uuid.uuid4())[:8],
            "at": at,
            "date_key": log_date_key(at),
            "kind": log_kind,
            "label": log_label,
            "market": log_kw.get("market", ""),
            "board": log_kw.get("board", ""),
            "count": log_kw.get("count", 0),
            "stocks": collect_stock_hints_from_session(),
            "conclusions_summary": summary,
        }
        log.insert(0, entry)
        store["query_log"] = log[:_MAX_LOG]
        snap = {
            "id": entry["id"],
            "saved_at": entry["at"],
            "label": log_label,
            "kind": log_kind,
            "state": store["latest"],
            "conclusions": conclusions,
        }
        snaps = store.setdefault("snapshots", [])
        snaps.insert(0, snap)
        store["snapshots"] = snaps[:_MAX_SNAPSHOTS]
    save_history(store)
    st.session_state["_history_dirty"] = False


def load_into_session() -> None:
    if st.session_state.get("_history_restored"):
        return
    store = load_history()
    if store.get("watchlist"):
        st.session_state.watchlist = store["watchlist"]
    if not st.session_state.get("query_log"):
        st.session_state.query_log = store.get("query_log", [])
    else:
        st.session_state.query_log = store.get("query_log", [])
    st.session_state.history_snapshots = store.get("snapshots", [])
    apply_latest_to_session(store.get("latest") or {})
    st.session_state["_history_restored"] = True


def get_snapshot_by_id(snap_id: str) -> dict[str, Any] | None:
    for s in load_history().get("snapshots", []):
        if str(s.get("id")) == str(snap_id):
            return s
    return None


def mark_dirty() -> None:
    st.session_state["_history_dirty"] = True
