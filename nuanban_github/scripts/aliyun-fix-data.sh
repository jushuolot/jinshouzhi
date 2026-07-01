#!/usr/bin/env bash
# 阿里云服务器：拉代码 → 重启后端 → 导入集合 + 演示数据 → 重建 H5
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
"$ROOT/scripts/git-pull-cn.sh" "$GIT_ROOT"

chmod +x scripts/*.sh

# shellcheck disable=SC1091
source "$ROOT/scripts/lib/resolve-compose.sh"
resolve_nuanban_compose "$ROOT"
COMPOSE=(docker compose "${NUANBAN_COMPOSE_FILES[@]}")
echo "==> 部署模式: ${NUANBAN_DEPLOY_MODE}（Caddy profile: ${NUANBAN_CADDY_PROFILE}）"
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
  export VITE_RELEASE_CHANNEL=stable
  export VITE_API_BASE_URL="${H5_API_BASE}"
  [[ "${VITE_MAP_REAL:-}" == "true" ]] && export VITE_MAP_REAL=true

  if [[ -n "${NUANBAN_USER_HOST:-}" && -n "${NUANBAN_CONTROL_HOST:-}" ]]; then
    chmod +x scripts/build-h5-variant.sh
    USER_API="https://${NUANBAN_USER_HOST}/api"
    CONTROL_API="https://${NUANBAN_CONTROL_HOST}/api"
    VITE_API_BASE_URL="$USER_API" ./scripts/build-h5-variant.sh user
    VITE_API_BASE_URL="$CONTROL_API" ./scripts/build-h5-variant.sh control
  else
    cd packages/miniapp
    if [[ ! -d node_modules ]]; then
      npm install
    fi
    node "$ROOT/scripts/prepare-pages-json.mjs" unified
    VITE_APP_VARIANT=unified VITE_RELEASE_CHANNEL=stable VITE_API_BASE_URL="${H5_API_BASE}" npm run build:h5
    cd "$ROOT"
  fi

  H5_DIST="$ROOT/packages/miniapp/dist/build/h5/assets"
  if [[ ! -d "$H5_DIST" ]]; then
    H5_DIST="$ROOT/packages/miniapp/dist/build/h5-user/assets"
  fi
  if [[ -d "$H5_DIST" ]] && ls "$H5_DIST"/request.*.js >/dev/null 2>&1; then
    if [[ "${H5_API_BASE}" == https://* ]]; then
      if grep -rq 'http://101\.' "$H5_DIST"/request.*.js 2>/dev/null; then
        echo "错误：H5 仍含 HTTP IP API，HTTPS 站点会无法登录。请检查 VITE_API_BASE_URL=${H5_API_BASE}"
        exit 1
      fi
      ok_api="$(grep -ohE '"https://[^"]+/api"' "$H5_DIST"/request.*.js | head -1 || true)"
      echo "  ✓ H5 API 已写入: ${ok_api:-（运行时同域 /api 兜底）}"
    fi
  fi

  echo "==> 重启 Caddy（profile ${NUANBAN_CADDY_PROFILE}）"
  "${COMPOSE[@]}" --profile "${NUANBAN_CADDY_PROFILE}" restart caddy 2>/dev/null || \
    "${COMPOSE[@]}" --profile "${NUANBAN_CADDY_PROFILE}" up -d caddy
fi

echo ""
echo "完成。请强刷浏览器 (Ctrl+Shift+R):"
if [[ -n "${NUANBAN_USER_HOST:-}" ]]; then
  echo "  https://${NUANBAN_USER_HOST}/#/pages/common/login"
  echo "  https://${NUANBAN_CONTROL_HOST:-control.${NUANBAN_DOMAIN:-nuanbao.cc}}/#/pages/common/ops-gate"
elif [[ -n "${NUANBAN_DOMAIN:-}" ]]; then
  echo "  https://${NUANBAN_DOMAIN}/#/pages/common/login"
elif [[ -n "$STAGING_IP" ]]; then
  echo "  http://${STAGING_IP}/#/pages/common/login"
else
  echo "  你的 H5 登录页"
fi
echo "测试: 13800000001 验证码 000000（或先获取验证码）"
