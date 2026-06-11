#!/usr/bin/env bash
# 兼容旧名 → release-formal.sh（GitHub 正式制作版）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/release-formal.sh"
