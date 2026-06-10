#!/usr/bin/env bash
# 备案期间临时部署：用服务器公网 IP + HTTP 访问（备案通过后改 deploy-public.sh）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

STAGING_IP="${NUANBAN_STAGING_IP:-}"
if [[ -z "$STAGING_IP" ]]; then
  STAGING_IP="$(curl -fsS --max-time 5 ifconfig.me 2>/dev/null || curl -fsS --max-time 5 icanhazip.com 2>/dev/null || true)"
fi
if [[ -z "$STAGING_IP" ]]; then
  echo "请在 config/demo.env 设置 NUANBAN_STAGING_IP=你的服务器公网IP"
  exit 1
fi

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging.yml)
LOGIN_PATH="/#/pages/common/login"
STAGING_URL="http://${STAGING_IP}${LOGIN_PATH}"

echo "==> 备案中临时部署（HTTP · ${STAGING_IP}）"
echo "    备案通过后请执行: ./scripts/deploy-public.sh"

echo "==> 0/4 清理旧容器与占用端口"
"${COMPOSE[@]}" down 2>/dev/null || true
docker rm -f nuanban-pocketbase nuanban-caddy-staging 2>/dev/null || true
if ss -tlnp 2>/dev/null | grep -q ':8090 '; then
  echo "    释放 8090 端口..."
  fuser -k 8090/tcp 2>/dev/null || true
  sleep 1
fi

echo "==> 1/4 启动 PocketBase"
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

echo "==> 2/4 写入演示数据"
NUANBAN_API=http://localhost:8090 ./scripts/seed-demo.sh

echo "==> 3/4 构建 H5（API: http://${STAGING_IP}/api）"
cd packages/miniapp
if [[ ! -d node_modules ]]; then
  npm install
fi
VITE_API_BASE_URL="http://${STAGING_IP}/api" npm run build:h5
cd "$ROOT"

echo "==> 4/4 启动 Caddy（仅 HTTP :80）"
"${COMPOSE[@]}" --profile staging up -d caddy
sleep 2

echo ""
echo "=============================================="
echo "备案中 · 临时访问（HTTP，勿对外正式推广）"
echo ""
echo "  H5:  ${STAGING_URL}"
echo "  后台: http://${STAGING_IP}/_/"
echo ""
echo "  确认安全组已放行 TCP 80"
echo ""
echo "  备案通过后："
echo "    1) DNS: nuanban.cc → ${STAGING_IP}"
echo "    2) ./scripts/deploy-public.sh"
echo "=============================================="
