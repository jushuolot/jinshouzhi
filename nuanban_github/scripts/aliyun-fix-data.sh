#!/usr/bin/env bash
# 阿里云服务器：拉代码 → 重启后端 → 导入集合 + 演示数据 → 重建 H5
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
"$ROOT/scripts/git-pull-cn.sh" "$GIT_ROOT"

chmod +x scripts/*.sh

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging.yml)
echo "==> 重启 PocketBase（加载最新 hooks）"
"${COMPOSE[@]}" restart pocketbase
sleep 3

NUANBAN_API=http://127.0.0.1:8090 ./scripts/pb-init-server.sh

echo "==> 冒烟测试学生端 API"
if ! BASE=http://127.0.0.1:8090 ./scripts/pb-smoke-student.sh; then
  echo "警告：冒烟测试未全部通过，请检查 PocketBase hooks 是否已更新（需含 pb_hooks/nuanban_lib.js）"
fi

STAGING_IP="${NUANBAN_STAGING_IP:-}"
if [[ -z "$STAGING_IP" ]]; then
  STAGING_IP="$(curl -fsS --max-time 5 ifconfig.me 2>/dev/null || curl -fsS --max-time 5 icanhazip.com 2>/dev/null || true)"
fi

if [[ -n "${NUANBAN_DOMAIN:-}" ]]; then
  H5_API_BASE="https://${NUANBAN_DOMAIN}/api"
elif [[ -n "${NUANBAN_PUBLIC_API:-}" ]]; then
  H5_API_BASE="${NUANBAN_PUBLIC_API%/}/api"
elif [[ -n "$STAGING_IP" ]]; then
  H5_API_BASE="http://${STAGING_IP}/api"
fi

if [[ -n "${H5_API_BASE:-}" ]]; then
  echo "==> 重建 H5（API: ${H5_API_BASE}）"
  cd packages/miniapp
  if [[ ! -d node_modules ]]; then
    npm install
  fi
  VITE_RELEASE_CHANNEL=stable VITE_API_BASE_URL="${H5_API_BASE}" npm run build:h5
  cd "$ROOT"
  echo "==> 重启 Caddy"
  "${COMPOSE[@]}" --profile staging restart caddy 2>/dev/null || \
    "${COMPOSE[@]}" --profile full restart caddy 2>/dev/null || \
    "${COMPOSE[@]}" --profile staging up -d caddy 2>/dev/null || \
    "${COMPOSE[@]}" --profile full up -d caddy
fi

echo ""
echo "完成。请强刷浏览器 (Ctrl+Shift+R):"
if [[ -n "${NUANBAN_DOMAIN:-}" ]]; then
  echo "  https://${NUANBAN_DOMAIN}/#/pages/common/login"
elif [[ -n "$STAGING_IP" ]]; then
  echo "  http://${STAGING_IP}/#/pages/common/login"
else
  echo "  你的 H5 登录页"
fi
echo "测试: 13800000001 验证码 000000（或先获取验证码）"
