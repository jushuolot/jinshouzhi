#!/usr/bin/env bash
# 清除本地 5174/5175 上的旧 dev 进程，避免打开 /login 仍看到其它项目（如历史金手指缓存）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/free-port.sh
. "$ROOT/scripts/lib/free-port.sh"

USER_PORT="${NUANBAN_USER_PORT:-5174}"
CONTROL_PORT="${NUANBAN_CONTROL_PORT:-5175}"

echo "==> 释放暖伴常用 dev 端口"
free_port "$USER_PORT"
free_port "$CONTROL_PORT"

echo ""
echo "==> 仓库内已无「金手指」项目代码"
echo "    若浏览器仍显示金手指，是 Cursor/Chrome 缓存了旧页面，请："
echo "    1. 关闭所有 localhost:${USER_PORT} / ${CONTROL_PORT} 标签页"
echo "    2. 重新 ./scripts/start-h5-user.sh"
echo "    3. 只打开终端打印的链接（含 # 号）："
echo "       http://localhost:${USER_PORT}/#/login"
echo "    4. 仍不对 → DevTools → Application → Service Workers → Unregister，再 Clear site data"
echo "    5. 或 Chrome 无痕窗口 / 系统浏览器: open 'http://localhost:${USER_PORT}/#/login'"
echo ""
echo "    切勿使用: http://localhost:${USER_PORT}/login （旧路径，已废弃）"
echo ""
