#!/usr/bin/env bash
# 暖伴勤工 H5 本地开发（端口 5174）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${NUANBAN_DEV_PORT:-5174}"
MINIAPP="$ROOT/packages/miniapp"

echo "==> 检查端口 $PORT（暖伴勤工专用）"
pids=$(lsof -ti :"$PORT" 2>/dev/null || true)
if [ -n "$pids" ]; then
  echo "    端口 $PORT 被占用，正在释放: $pids"
  kill -9 $pids 2>/dev/null || true
  sleep 0.5
fi

if [ ! -f "$MINIAPP/.env" ]; then
  cp "$MINIAPP/.env.example" "$MINIAPP/.env"
  echo "    已创建 packages/miniapp/.env"
fi

if ! grep -q '^VITE_DEMO_MOCK=true' "$MINIAPP/.env" 2>/dev/null; then
  echo "    警告: .env 未设置 VITE_DEMO_MOCK=true，运营台/演示数据可能为空"
fi

echo ""
echo "==> 启动暖伴 H5 → http://localhost:$PORT/#/pages/common/launch"
echo ""

cd "$MINIAPP"
exec npm run dev:h5
