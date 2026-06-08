"""读取 GitHub Actions 写入的 cloud_state/latest_picks.json。"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
LATEST = ROOT / "cloud_state" / "latest_picks.json"


def load_cloud_picks(path: Path | None = None) -> dict[str, Any] | None:
    p = path or LATEST
    if not p.is_file():
        return None
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not isinstance(data, dict):
        return None
    if not data.get("picks") and not data.get("generated_at"):
        return None
    return data
