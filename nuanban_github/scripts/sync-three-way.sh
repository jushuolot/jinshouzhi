#!/usr/bin/env bash
# 本地 → GitHub（仅测试版；正式版请单独 release-prod.sh）
# 兼容旧用法；推荐直接用 ./scripts/release-test.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "提示: sync-three-way 已改为仅发布测试版。正式版请执行: ./scripts/release-prod.sh"
echo ""

exec "$ROOT/scripts/release-test.sh"
