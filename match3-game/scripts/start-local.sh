#!/usr/bin/env bash
# 一键启动：游戏页面 + 本地收益记账服务（可选，本地调试用）
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${PORT:-3456}"
AD_PORT="${AD_PORT:-3920}"

echo "══════════════════════════════════════"
echo "  古蜀秘档 · 本地运行"
echo "  游戏地址: http://localhost:${PORT}"
echo "  收益查询: http://localhost:${AD_PORT}/stats"
echo "  看收益: 游戏里连点标题 5 次 → 口令 Mz168"
echo "══════════════════════════════════════"

cd "$ROOT/ad-server"
if [ ! -d node_modules ]; then
  echo "首次运行，安装 ad-server…"
  npm install --silent
fi
PORT="$AD_PORT" node server.js &
AD_PID=$!

cd "$ROOT"
python3 -m http.server "$PORT" &
HTTP_PID=$!

cleanup() {
  kill "$AD_PID" "$HTTP_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

wait
