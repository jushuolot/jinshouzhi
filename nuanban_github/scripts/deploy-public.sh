#!/usr/bin/env bash
# 在云服务器上部署/更新公网演示站（常驻，无需本地开终端）
# 首次：配置 config/demo.env + .env(PB_ENCRYPTION_KEY) 后执行本脚本
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

: "${NUANBAN_DOMAIN:?请在 config/demo.env 设置 NUANBAN_DOMAIN}"

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.prod.yml)
LOGIN_PATH="/#/pages/common/login"
DEMO_URL="${NUANBAN_DEMO_URL:-https://${NUANBAN_DOMAIN}${LOGIN_PATH}}"

echo "==> 1/5 生成 Caddy 配置（${NUANBAN_DOMAIN}）"
sed "s/__DOMAIN__/${NUANBAN_DOMAIN}/g" Caddyfile.prod.example > Caddyfile.prod

echo "==> 2/5 启动 PocketBase"
"${COMPOSE[@]}" up -d pocketbase
for i in $(seq 1 40); do
  if docker exec nuanban-pocketbase wget -q --spider http://127.0.0.1:8090/api/health 2>/dev/null; then
    break
  fi
  if [[ "$i" -eq 40 ]]; then
    echo "错误：PocketBase 未就绪，见 docker compose logs pocketbase"
    exit 1
  fi
  sleep 1
done

echo "==> 3/5 写入演示数据"
NUANBAN_API=http://localhost:8090 ./scripts/seed-demo.sh

echo "==> 4/5 构建 H5（API: https://${NUANBAN_DOMAIN}/api）"
cd packages/miniapp
if [[ ! -d node_modules ]]; then
  npm install
fi
VITE_RELEASE_CHANNEL=production VITE_API_BASE_URL="https://${NUANBAN_DOMAIN}/api" npm run build:h5
cd "$ROOT"

echo "==> 5/5 启动 Caddy（80/443，HTTPS 常驻）"
"${COMPOSE[@]}" --profile full up -d caddy
sleep 3

if ! curl -sf "https://${NUANBAN_DOMAIN}/api/health" >/dev/null 2>&1; then
  echo "警告：HTTPS 健康检查未通过，可能是证书申请中或 DNS 未生效。"
  echo "请确认：1) 域名已解析到本机  2) 安全组开放 80/443  3) docker compose logs caddy"
else
  echo "    API 健康检查通过"
fi

echo ""
echo "=============================================="
echo "公网演示站已更新（常驻运行，关本地电脑不影响）"
echo ""
echo "  客人链接: ${DEMO_URL}"
echo ""
echo "  管理后台: https://${NUANBAN_DOMAIN}/_/"
echo "  查看状态: docker compose -f docker-compose.yml -f docker-compose.prod.yml ps"
echo "=============================================="
