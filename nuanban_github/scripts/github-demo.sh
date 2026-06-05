#!/usr/bin/env bash
# GitHub Codespaces / 本机快速演示（H5+API 合一，端口 8080，公网预览用 Codespaces 端口面板）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT=8080
LOGIN_PATH="/#/pages/common/login"

echo "==> 启动 PocketBase + 演示数据"
docker compose up -d pocketbase
for i in $(seq 1 30); do
  if curl -sf "http://localhost:8090/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
./scripts/seed-demo.sh

echo "==> 构建 H5（同域 /api）"
cd packages/miniapp
if [[ ! -d node_modules ]]; then
  npm install
fi
VITE_API_BASE_URL=/api npm run build:h5
cd "$ROOT"

echo "==> 启动 Caddy（${PORT}）"
docker compose --profile full up -d caddy
sleep 2

echo ""
echo "=============================================="
echo "  本机/Codespaces: http://localhost:${PORT}${LOGIN_PATH}"
echo ""
echo "  Codespaces：打开 PORTS 面板 → 8080 → 设为 Public → 复制 HTTPS 链接发给客人"
echo "  长期固定链接请用 GitHub Pages + Render，见 docs/GITHUB_DEMO.md"
echo "=============================================="
