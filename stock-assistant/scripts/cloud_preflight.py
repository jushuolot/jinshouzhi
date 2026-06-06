#!/usr/bin/env python3
"""Streamlit Cloud 部署前自检（本地或 CI 运行）。"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.util.cloud_preflight import run_preflight  # noqa: E402


def main() -> int:
    skip = "--skip-imports" in sys.argv
    errors = run_preflight(skip_imports=skip, root=ROOT)
    if errors:
        print("[cloud_preflight] 未通过：")
        for e in errors:
            print(f"  - {e}")
        return 1
    print("[cloud_preflight] 通过 ✓  可 push 后在 Streamlit Cloud 点 Reboot app")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
