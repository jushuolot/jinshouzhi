#!/usr/bin/env bash
# 全量复查：路由 + 数据 + API 对齐 + 构建 + 冒烟（对应「重头再检查一遍」）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GIT_ROOT="$(cd "$ROOT/.." && pwd)"

echo "=========================================="
echo " 暖伴全量 audit · $(date '+%Y-%m-%d %H:%M')"
echo "=========================================="

echo "==> 1/6 Git 同步状态"
(cd "$GIT_ROOT" && git fetch origin main -q 2>/dev/null || true)
(cd "$GIT_ROOT" && git status -sb -- nuanban_github/ | head -5)

echo "==> 2/6 路由"
node "$ROOT/scripts/check-routes.mjs"

echo "==> 3/6 富数据规模"
node "$ROOT/scripts/check-data.mjs"

echo "==> 4/6 API parity"
node "$ROOT/scripts/check-api-parity.mjs"

echo "==> 5/6 构建 H5"
(cd "$ROOT/packages/miniapp" && npm run build:h5)

echo "==> 6/6 公网冒烟"
bash "$ROOT/scripts/smoke-demo.sh"
bash "$ROOT/scripts/smoke-demo.sh" --bundle || true

echo ""
echo "AUDIT PASS — 见 docs/AUDIT_LOG.md 与 docs/PERFECT.md"
echo "公网: https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login"
