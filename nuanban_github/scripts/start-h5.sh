#!/usr/bin/env bash
# 暖伴勤工 H5 本地开发（端口 5174）
# 用法：在 nuanban_github 目录执行 ./scripts/start-h5.sh
set -eo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
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

if [ ! -f "$MINIAPP/.env" ]; then
  cp "$MINIAPP/.env.example" "$MINIAPP/.env"
  echo "    已创建 packages/miniapp/.env"
fi

if grep -q '^VITE_DEMO_MOCK=true' "$MINIAPP/.env" 2>/dev/null; then
  echo "    模式: Mock（不依赖 PocketBase 响应）"
elif grep -q '^VITE_DEMO_MOCK=false' "$MINIAPP/.env" 2>/dev/null; then
  echo "    模式: parity（PocketBase，与阿里云一致）"
else
  echo "    提示: 建议 .env 设置 VITE_DEMO_MOCK=false，见 docs/ENV_PARITY.md"
fi

echo ""
echo "==> 启动暖伴 H5 -> http://localhost:${PORT}/#/pages/common/launch"
echo ""

cd "$MINIAPP"
exec npm run dev:h5
