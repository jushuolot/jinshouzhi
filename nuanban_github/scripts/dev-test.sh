#!/usr/bin/env bash
# 本地联调：启动 PocketBase + 写入演示数据
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
ENV_FILE="$ROOT/packages/miniapp/.env"
ENV_EXAMPLE="$ROOT/packages/miniapp/.env.example"

ensure_local_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$ENV_EXAMPLE" "$ENV_FILE"
    echo "    已从 .env.example 创建 packages/miniapp/.env"
    return
  fi
  for key in VITE_RELEASE_CHANNEL VITE_DEMO_MOCK; do
    if ! grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
      grep "^${key}=" "$ENV_EXAMPLE" >> "$ENV_FILE" || true
      echo "    已补全 .env: ${key}"
    fi
  done
  if grep -q '^VITE_DEMO_MOCK=' "$ENV_FILE" && ! grep -q '^VITE_DEMO_MOCK=false' "$ENV_FILE"; then
    echo "    提示: parity 模式建议 VITE_DEMO_MOCK=false（与阿里云一致，见 docs/ENV_PARITY.md）"
  fi
}

echo "==> 0/3 检查前端 .env（parity 模式）"
ensure_local_env

echo "==> 1/3 启动 PocketBase (docker compose)"
if docker ps -a --format '{{.Names}}' | grep -qx 'nuanban-pocketbase'; then
  docker start nuanban-pocketbase 2>/dev/null || true
  docker compose up -d pocketbase 2>/dev/null || echo "    使用已有容器 nuanban-pocketbase"
else
  docker compose up -d pocketbase
fi

echo "==> 2/3 等待 API 就绪"
BASE="${NUANBAN_API:-http://localhost:8090}"
for i in $(seq 1 30); do
  if curl -sf "$BASE/api/health" >/dev/null 2>&1; then
    echo "    API OK: $BASE/api/health"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "超时：请执行 docker compose logs pocketbase"
    exit 1
  fi
  sleep 1
done

echo "==> 3/3 写入演示数据"
"$ROOT/scripts/seed-demo.sh"

echo ""
echo "=========================================="
echo " 后端已就绪"
echo "   API:   $BASE/api"
echo "   Admin: $BASE/_/"
echo ""
echo " 下一步（新开终端）："
echo "   ./scripts/start-h5.sh"
echo "   浏览器打开 http://localhost:5174/#/pages/common/launch"
echo "   确认 .env 含 VITE_DEMO_MOCK=false → 与阿里云同 PocketBase 逻辑"
echo "   （纯 Mock 演示可设 VITE_DEMO_MOCK=true）"
echo "   学生核验照落盘: dev-data/verification-photos/（拍照后生成）"
echo ""
"$ROOT/scripts/print-phone-dev-url.sh"
echo "详细说明: docs/LOCAL_TEST.md"
