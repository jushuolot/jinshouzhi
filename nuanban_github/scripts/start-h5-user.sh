#!/usr/bin/env bash
# 本地用户端 H5（端口 5174）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/free-port.sh
. "$ROOT/scripts/lib/free-port.sh"
# shellcheck source=lib/lan-ip.sh
. "$ROOT/scripts/lib/lan-ip.sh"

PORT="${NUANBAN_USER_PORT:-5174}"
ENTRY="http://localhost:${PORT}/#/login"
LAN_IP="$(get_lan_ip || true)"
LAN_ENTRY=""
if [[ -n "$LAN_IP" ]]; then
  LAN_ENTRY="http://${LAN_IP}:${PORT}/#/login"
fi

free_port "$PORT"

node "$ROOT/scripts/prepare-pages-json.mjs" user
cd "$ROOT/packages/miniapp"
export VITE_APP_VARIANT=user
export VITE_RELEASE_CHANNEL="${VITE_RELEASE_CHANNEL:-formal}"
export VITE_DEMO_MOCK=false
export VITE_MAP_REAL="${VITE_MAP_REAL:-false}"
export UNI_H5_PORT="$PORT"

echo ""
echo "==> 暖伴 · 用户端"
echo "    本机: ${ENTRY}"
if [[ -n "$LAN_ENTRY" ]]; then
  echo "    手机（同 WiFi）: ${LAN_ENTRY}"
else
  echo "    手机: 未检测到局域网 IP，请在本机 WiFi 设置中查看 IP"
fi
echo "    注意: 换 WiFi 后 IP 会变，以启动时打印为准"
echo ""

exec npm run dev:h5
