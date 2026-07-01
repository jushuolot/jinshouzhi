#!/usr/bin/env bash
# V2 部署：user.nuanbao.cc + control.nuanbao.cc 双端 H5
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT"

: "${NUANBAN_DOMAIN:?请在 config/formal.env 设置 NUANBAN_DOMAIN}"
USER_HOST="${NUANBAN_USER_HOST:-user.${NUANBAN_DOMAIN}}"
CONTROL_HOST="${NUANBAN_CONTROL_HOST:-control.${NUANBAN_DOMAIN}}"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)

echo "==> 1/6 生成 Caddy 配置（${USER_HOST} + ${CONTROL_HOST}）"
sed -e "s/__DOMAIN__/${NUANBAN_DOMAIN}/g" \
    -e "s/__USER_HOST__/${USER_HOST}/g" \
    -e "s/__CONTROL_HOST__/${CONTROL_HOST}/g" \
    Caddyfile.prod.example > Caddyfile.prod

echo "==> 2/6 启动 PocketBase"
"${COMPOSE[@]}" up -d pocketbase
for i in $(seq 1 40); do
  if docker exec nuanban-pocketbase wget -q --spider http://127.0.0.1:8090/api/health 2>/dev/null; then
    break
  fi
  if [[ "$i" -eq 40 ]]; then
    echo "错误：PocketBase 未就绪"
    exit 1
  fi
  sleep 1
done

echo "==> 3/6 写入演示数据"
NUANBAN_API=http://localhost:8090 ./scripts/seed-demo.sh

export VITE_RELEASE_CHANNEL=stable
[[ "${VITE_MAP_REAL:-}" == "true" ]] && export VITE_MAP_REAL=true

echo "==> 4/6 构建用户端 H5"
export VITE_API_BASE_URL="https://${USER_HOST}/api"
chmod +x scripts/build-h5-variant.sh
./scripts/build-h5-variant.sh user

echo "==> 5/6 构建运营台 H5"
export VITE_API_BASE_URL="https://${CONTROL_HOST}/api"
./scripts/build-h5-variant.sh control

echo "==> 6/6 启动 Caddy"
"${COMPOSE[@]}" --profile full up -d caddy
sleep 3

for host in "$USER_HOST" "$CONTROL_HOST"; do
  if curl -sf "https://${host}/api/health" >/dev/null 2>&1; then
    echo "    ✓ https://${host}/api/health"
  else
    echo "    ⚠ https://${host}/api/health 未通过（DNS/证书可能仍在生效）"
  fi
done

echo ""
echo "=============================================="
echo "V2 已部署"
echo "  用户端:   https://${USER_HOST}/#/pages/common/login"
echo "  运营台:   https://${CONTROL_HOST}/#/pages/common/ops-gate"
echo "  PB 管理:  https://${USER_HOST}/_/"
echo "=============================================="
