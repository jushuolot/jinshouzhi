#!/usr/bin/env bash
# 生成公网 HTTPS 演示链接，客人用手机/电脑浏览器直接访问
# 依赖：Docker Desktop、Node.js；公网隧道二选一 cloudflared（推荐）或 localtunnel
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PORT_LOCAL=8080
LOGIN_PATH="/#/pages/common/login"

echo "==> 1/4 启动 PocketBase + 演示数据"
docker compose up -d pocketbase
for i in $(seq 1 30); do
  if curl -sf "http://localhost:8090/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
./scripts/seed-demo.sh

echo "==> 2/4 构建 H5 静态包（API 走同域 /api）"
cd packages/miniapp
if [[ ! -d node_modules ]]; then
  npm install
fi
VITE_API_BASE_URL=/api npm run build:h5
cd "$ROOT"

echo "==> 3/4 启动 Caddy（H5 + API 合一，端口 ${PORT_LOCAL}）"
docker compose --profile full up -d caddy
sleep 2
if ! curl -sf "http://localhost:${PORT_LOCAL}/api/health" >/dev/null; then
  echo "错误：Caddy 或 API 未就绪，请检查: docker compose logs caddy pocketbase"
  exit 1
fi
echo "    本地合一地址: http://localhost:${PORT_LOCAL}${LOGIN_PATH}"

echo "==> 4/4 创建公网隧道（HTTPS，手机可开）"
PUBLIC_URL=""

if command -v cloudflared >/dev/null 2>&1; then
  echo "    使用 Cloudflare Tunnel…"
  LOG="$(mktemp)"
  cloudflared tunnel --url "http://localhost:${PORT_LOCAL}" 2>&1 | tee "$LOG" &
  TUNNEL_PID=$!
  for i in $(seq 1 25); do
    PUBLIC_URL="$(grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' "$LOG" | head -1 || true)"
    if [[ -n "$PUBLIC_URL" ]]; then
      break
    fi
    sleep 1
  done
  if [[ -z "$PUBLIC_URL" ]]; then
    kill "$TUNNEL_PID" 2>/dev/null || true
    echo "    Cloudflare 隧道启动超时，尝试 localtunnel…"
  fi
fi

if [[ -z "$PUBLIC_URL" ]] && command -v npx >/dev/null 2>&1; then
  echo "    使用 localtunnel…"
  LOG2="$(mktemp)"
  npx --yes localtunnel --port "$PORT_LOCAL" 2>&1 | tee "$LOG2" &
  LT_PID=$!
  for i in $(seq 1 25); do
    PUBLIC_URL="$(grep -oE 'https://[a-zA-Z0-9.-]+\.loca\.lt' "$LOG2" | head -1 || true)"
    if [[ -n "$PUBLIC_URL" ]]; then
      break
    fi
    sleep 1
  done
  if [[ -z "$PUBLIC_URL" ]]; then
    kill "$LT_PID" 2>/dev/null || true
  fi
fi

echo ""
echo "=============================================="
if [[ -n "$PUBLIC_URL" ]]; then
  echo "客人演示链接（发给客人即可）："
  echo ""
  echo "  ${PUBLIC_URL}${LOGIN_PATH}"
  echo ""
  echo "手机：微信/ Safari 打开上述链接 → 点「开发登录（学生/家属/老人）」"
  echo "保持本终端运行；关闭即断线。"
else
  echo "未能自动创建公网隧道。请先安装 cloudflared："
  echo "  brew install cloudflared"
  echo "然后手动执行："
  echo "  cloudflared tunnel --url http://localhost:${PORT_LOCAL}"
  echo "将生成的 https://xxx.trycloudflare.com 加上 ${LOGIN_PATH} 发给客人。"
  echo ""
  echo "同一 WiFi 内可先用手机访问（需电脑局域网 IP）："
  LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo '你的局域网IP')"
  echo "  http://${LAN_IP}:${PORT_LOCAL}${LOGIN_PATH}"
fi
echo "=============================================="
