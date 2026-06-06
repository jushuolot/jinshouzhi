"""推送自选股速览（Webhook / 邮件）。"""

from __future__ import annotations

import os
from typing import Any

import streamlit as st

from src.analysis.daily_digest import build_watchlist_digest
from src.auth.users import current_user_id
from src.notify.email_digest import get_smtp_config, send_digest_email
from src.notify.webhook import build_webhook_payload, get_webhook_url, post_webhook


def _app_url() -> str:
    try:
        v = st.secrets.get("STOCK_APP_PUBLIC_URL")
        if v:
            return str(v).strip()
    except Exception:
        pass
    return os.environ.get("STOCK_APP_PUBLIC_URL", "").strip()


def build_current_digest(session_state: Any | None = None) -> str:
    ss = session_state if session_state is not None else st.session_state
    wl = list(ss.get("watchlist") or [])
    snaps = dict(ss.get("watch_snapshots") or {})
    label = str(ss.get("query_label_watch") or ss.get("_auto_refresh_at") or "")
    return build_watchlist_digest(wl, snaps, query_label=label)


def push_digest_webhook(*, digest: str, session_state: Any | None = None) -> tuple[bool, str]:
    url = get_webhook_url()
    if not url:
        return False, "未配置 STOCK_WEBHOOK_URL"
    ss = session_state if session_state is not None else st.session_state
    payload = build_webhook_payload(
        digest_markdown=digest,
        watchlist=list(ss.get("watchlist") or []),
        snapshots=dict(ss.get("watch_snapshots") or {}),
        user_id=current_user_id() if session_state is None else str(ss.get("_auth_user") or "default"),
        app_url=_app_url(),
    )
    return post_webhook(url, payload)


def push_digest_email(*, digest: str, subject: str = "Stock Assistant · 自选股速览") -> tuple[bool, str]:
    return send_digest_email(subject=subject, body=digest)


def push_digest_all(session_state: Any | None = None) -> list[str]:
    digest = build_current_digest(session_state)
    if not digest.strip():
        return ["无自选股数据"]
    lines: list[str] = []
    if get_webhook_url():
        ok, msg = push_digest_webhook(digest=digest, session_state=session_state)
        lines.append(f"Webhook: {'✓' if ok else '✗'} {msg}")
    if get_smtp_config():
        ok, msg = push_digest_email(digest=digest)
        lines.append(f"邮件: {'✓' if ok else '✗'} {msg}")
    if len(lines) == 0:
        lines.append("未配置 Webhook 或 SMTP，见 docs/PUSH.md")
    return lines


def maybe_push_after_refresh(session_state: Any | None = None) -> None:
    ss = session_state if session_state is not None else st.session_state
    if not ss.get("push_webhook_on_refresh") and not ss.get("push_email_on_refresh"):
        return
    digest = build_current_digest(ss)
    if ss.get("push_webhook_on_refresh") and get_webhook_url():
        push_digest_webhook(digest=digest, session_state=ss)
    if ss.get("push_email_on_refresh") and get_smtp_config():
        push_digest_email(digest=digest)
