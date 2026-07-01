#!/usr/bin/env bash
# 本地运营台 H5（端口 5175）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck source=lib/free-port.sh
. "$ROOT/scripts/lib/free-port.sh"
# shellcheck source=lib/lan-ip.sh
. "$ROOT/scripts/lib/lan-ip.sh"

PORT="${NUANBAN_CONTROL_PORT:-5175}"
ENTRY="http://localhost:${PORT}/#/pages/common/ops-gate"
LAN_IP="$(get_lan_ip || true)"
LAN_ENTRY=""
if [[ -n "$LAN_IP" ]]; then
  LAN_ENTRY="http://${LAN_IP}:${PORT}/#/pages/common/ops-gate"
fi

free_port "$PORT"

node "$ROOT/scripts/prepare-pages-json.mjs" control
cd "$ROOT/packages/miniapp"
export VITE_APP_VARIANT=control
export VITE_RELEASE_CHANNEL="${VITE_RELEASE_CHANNEL:-formal}"
export VITE_DEMO_MOCK=false
export UNI_H5_PORT="$PORT"

echo ""
echo "==> 暖伴 · 运营台"
echo "    本机: ${ENTRY}"
if [[ -n "$LAN_ENTRY" ]]; then
  echo "    手机（同 WiFi）: ${LAN_ENTRY}"
fi
echo "    口令: nuanban2026"
echo ""

exec npm run dev:h5
