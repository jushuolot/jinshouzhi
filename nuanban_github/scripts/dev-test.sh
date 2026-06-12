#!/usr/bin/env bash
# 本地联调：启动 PocketBase + 写入测试数据（seed-demo / 可选万人压测）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/ensure-parity-env.sh
. "$ROOT/scripts/lib/ensure-parity-env.sh"

echo "==> 0/3 检查前端 .env（parity · 非 Mock）"
ensure_parity_env "$ROOT"

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

echo "==> 3/3 写入测试数据（seed-demo）"
"$ROOT/scripts/seed-demo.sh"

echo ""
echo "=========================================="
echo " 后端已就绪（PocketBase 测试数据，非浏览器 Mock）"
echo "   API:   $BASE/api"
echo "   Admin: $BASE/_/"
echo ""
echo " 下一步（新开终端）："
echo "   ./scripts/start-h5.sh"
echo "   浏览器打开 http://localhost:5174/#/pages/common/launch"
echo "   .env 已固定 VITE_DEMO_MOCK=false · 与阿里云同 PocketBase 逻辑"
echo "   万人压测数据: npm run stress:seed-10k（见 docs/STRESS_AND_FLOW_TEST.md）"
echo "   学生核验照落盘: dev-data/verification-photos/（拍照后生成）"
echo ""
"$ROOT/scripts/print-phone-dev-url.sh"
echo "详细说明: docs/LOCAL_TEST.md"
