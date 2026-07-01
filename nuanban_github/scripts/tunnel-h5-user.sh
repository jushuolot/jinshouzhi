#!/usr/bin/env bash
# 手机局域网 -109 时，用公网隧道访问本机 5174（无需同网段）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${NUANBAN_USER_PORT:-5174}"

if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "⚠ 端口 ${PORT} 未监听。请先另开终端运行: ./scripts/start-h5-user.sh"
  exit 1
fi

echo "=============================================="
echo "暖伴 · 手机隧道（绕过局域网 AP 隔离）"
echo "=============================================="
echo ""
echo "本机 dev 已在 :${PORT} 运行。"
echo "正在启动 localtunnel（首次可能需 10–20 秒）..."
echo ""
echo "启动后用手机浏览器打开打印的 https://xxx.loca.lt/#/login"
echo "若出现 loca.lt 验证页：在页面输入本机公网 IP（脚本会尝试打印）。"
echo "按 Ctrl+C 停止隧道。"
echo ""

exec npx --yes localtunnel --port "$PORT"
