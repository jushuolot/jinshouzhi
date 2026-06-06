#!/usr/bin/env python3
"""定时任务：从本地 history 推送自选股速览（P8，无需打开浏览器）。

用法（cron / launchd）:
  cd stock-assistant
  export STOCK_WEBHOOK_URL='https://hooks.example.com/...'
  # 或配置 SMTP 环境变量，见 docs/PUSH.md
  python3 scripts/push_digest_cron.py

仅在有提醒时推送:
  python3 scripts/push_digest_cron.py --alerts-only

多用户:
  export STOCK_USER='alice'   # 对应 secrets [passwords] 的键名
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.analysis.daily_digest import build_watchlist_digest  # noqa: E402
from src.analysis.watch_alerts import compute_watch_alerts  # noqa: E402
from src.notify.digest_push import push_digest_email, push_digest_webhook  # noqa: E402
from src.notify.email_digest import get_smtp_config  # noqa: E402
from src.notify.webhook import get_webhook_url  # noqa: E402
from src.storage.paths import history_file_path  # noqa: E402


def load_store(user_id: str) -> dict:
    path = history_file_path(user_id=user_id)
    if not path.is_file():
        raise FileNotFoundError(f"无历史文件：{path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def _alert_thresholds(store: dict) -> dict[str, float]:
    prefs = (store.get("latest") or {}).get("user_prefs") or {}
    return {
        "pct_up": float(prefs.get("alert_pct_up") or 5.0),
        "pct_down": float(prefs.get("alert_pct_down") or -5.0),
        "score_low": float(prefs.get("alert_score_low") or 40.0),
        "score_high": float(prefs.get("alert_score_high") or 65.0),
    }


def main() -> int:
    user = os.environ.get("STOCK_USER", "default").strip() or "default"
    dry = "--dry-run" in sys.argv
    alerts_only = "--alerts-only" in sys.argv
    try:
        store = load_store(user)
    except FileNotFoundError as exc:
        print(str(exc))
        return 1
    wl = store.get("watchlist") or []
    latest = store.get("latest") or {}
    snaps = latest.get("watch_snapshots") or {}
    if not wl:
        print("[push_digest_cron] 自选股为空，跳过")
        return 0
    thresholds = _alert_thresholds(store)
    alerts = compute_watch_alerts(wl, snaps, **thresholds)
    if alerts_only and not alerts:
        print("[push_digest_cron] --alerts-only: 无提醒，跳过")
        return 0
    digest = build_watchlist_digest(wl, snaps, alerts=alerts or None)
    if dry:
        print(
            f"[push_digest_cron] dry-run bytes={len(digest.encode('utf-8'))} "
            f"alerts={len(alerts)} alerts_only={alerts_only}"
        )
        return 0

    from src.notify.retry import drain_queue, load_queue  # noqa: E402

    def _retry_handler(item: dict) -> tuple[bool, str]:
        d = str(item.get("digest") or digest)
        ch = str(item.get("channel") or "")
        ss_d = item.get("session") or {"watchlist": wl, "watch_snapshots": snaps, "_auth_user": user}

        class SS:
            def __init__(self, dct):
                self._d = dct

            def get(self, k, default=None):
                return self._d.get(k, default)

        ss = SS(ss_d)
        if ch == "webhook":
            return push_digest_webhook(digest=d, session_state=ss)
        if ch == "email":
            return push_digest_email(digest=d, session_state=ss)
        return False, "unknown"

    if load_queue(user_id=user):
        for line in drain_queue(_retry_handler, user_id=user, max_items=5):
            print(f"Retry: {line}")

    class _SS:
        def __init__(self) -> None:
            self._d = {
                "watchlist": wl,
                "watch_snapshots": snaps,
                "_auth_user": user,
            }

        def get(self, k, default=None):
            return self._d.get(k, default)

    ss = _SS()
    ok_any = False
    if get_webhook_url():
        ok, msg = push_digest_webhook(digest=digest, session_state=ss)
        print(f"Webhook: {'OK' if ok else 'FAIL'} {msg}")
        ok_any = ok_any or ok
    if get_smtp_config():
        ok, msg = push_digest_email(digest=digest)
        print(f"Email: {'OK' if ok else 'FAIL'} {msg}")
        ok_any = ok_any or ok
    if not get_webhook_url() and not get_smtp_config():
        print("[push_digest_cron] 未配置 STOCK_WEBHOOK_URL 或 SMTP")
        return 1
    return 0 if ok_any else 1


if __name__ == "__main__":
    raise SystemExit(main())
