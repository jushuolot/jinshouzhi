#!/usr/bin/env bash
# 暖伴勤工 H5 本地开发（端口 5174）· parity 模式（PocketBase 测试数据）
# 用法：先 ./scripts/dev-test.sh，再 ./scripts/start-h5.sh
set -eo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/ensure-parity-env.sh
. "$ROOT/scripts/lib/ensure-parity-env.sh"

PORT=5174
if [ -n "${NUANBAN_DEV_PORT:-}" ]; then
  PORT="$NUANBAN_DEV_PORT"
fi
MINIAPP="$ROOT/packages/miniapp"

echo "==> 检查端口 ${PORT} (暖伴勤工)"
pids="$(lsof -ti :"${PORT}" 2>/dev/null || true)"
if [ -n "$pids" ]; then
  echo "    端口 ${PORT} 被占用，正在释放: $pids"
  kill -9 $pids 2>/dev/null || true
  sleep 0.5
fi

echo "==> 检查前端 .env（parity · PocketBase 测试数据）"
ensure_parity_env "$ROOT"

echo "    模式: 正式版（formal · PocketBase 真实登录流，无演示捷径）"
echo "    Mock 仅用于 GitHub Pages；本地请勿设 VITE_DEMO_MOCK=true"

echo ""
echo "==> 启动暖伴 H5 -> http://localhost:${PORT}/#/pages/common/login"
echo "    勿用 /login（已废弃，访问会 301 跳转）"
echo "    后端未启时请另开终端: ./scripts/dev-test.sh"
echo ""

cd "$MINIAPP"
exec npm run dev:h5
