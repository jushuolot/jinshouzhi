#!/usr/bin/env bash
# 一键验证：preflight + 单元测试（P14 / P99）
set -euo pipefail
cd "$(dirname "$0")/.."
source .venv/bin/activate 2>/dev/null || true
python3 scripts/cloud_preflight.py
python3 -m unittest discover -s tests -q
echo "[evolve_verify] OK"
