#!/usr/bin/env python3
"""GitHub Actions / 公网定时：预测明日 A 股并写入 cloud_state（零本地）。

用法:
  cd stock-assistant
  python3 scripts/garden_cloud_cron.py
  python3 scripts/garden_cloud_cron.py --stdout

环境变量（GitHub Secrets）:
  STOCK_WEBHOOK_URL  — 可选，推送今日推荐 Markdown
"""

from __future__ import annotations

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.analysis.tomorrow_picks import fetch_garden_picks_bundle, picks_to_markdown, tomorrow_trading_date  # noqa: E402
from src.providers import market_data  # noqa: E402
from src.ui import app_core as C  # noqa: E402

CLOUD_STATE_DIR = ROOT / "cloud_state"
LATEST_JSON = CLOUD_STATE_DIR / "latest_picks.json"


def _fetch_ranking():
    return market_data.fetch_a_ranking_multi(board="涨幅榜", limit=60)


def run_scan(*, max_picks: int = 5) -> dict:
    a_picks, global_picks, src, stats = fetch_garden_picks_bundle(
        _fetch_ranking,
        C._fetch_one,
        max_a=max_picks,
        max_global_per_market=2,
    )
    now = datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")
    tgt = stats.get("predict_for") or tomorrow_trading_date()
    payload = {
        "generated_at": now,
        "source": src,
        "stats": stats,
        "predict_for": tgt,
        "picks": [p.as_dict() for p in a_picks],
        "global_picks": [p.as_dict() for p in global_picks],
        "markdown": picks_to_markdown(
            a_picks, day=now[:10], global_picks=global_picks, target_date=tgt
        ),
    }
    return payload


def write_cloud_state(payload: dict) -> Path:
    CLOUD_STATE_DIR.mkdir(parents=True, exist_ok=True)
    LATEST_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    meta = CLOUD_STATE_DIR / "meta.json"
    meta.write_text(
        json.dumps(
            {
                "last_run": payload.get("generated_at"),
                "pick_count": len(payload.get("picks") or []),
                "runner": "garden_cloud_cron",
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    return LATEST_JSON


def maybe_webhook(payload: dict) -> None:
    url = os.environ.get("STOCK_WEBHOOK_URL", "").strip()
    if not url:
        return
    try:
        import urllib.request

        md = str(payload.get("markdown") or "")
        body = json.dumps({"text": md[:3500]}, ensure_ascii=False).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        urllib.request.urlopen(req, timeout=20)
        print("[garden_cloud_cron] webhook OK")
    except Exception as exc:
        print(f"[garden_cloud_cron] webhook FAIL: {exc}")


def main() -> int:
    stdout_only = "--stdout" in sys.argv
    try:
        payload = run_scan()
    except Exception as exc:
        print(f"[garden_cloud_cron] scan FAIL: {exc}")
        return 1
    n = len(payload.get("picks") or [])
    gn = len(payload.get("global_picks") or [])
    print(f"[garden_cloud_cron] a_picks={n} global={gn} source={payload.get('source')}")
    if stdout_only:
        print(payload.get("markdown") or "")
        return 0
    path = write_cloud_state(payload)
    print(f"[garden_cloud_cron] wrote {path}")
    maybe_webhook(payload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
