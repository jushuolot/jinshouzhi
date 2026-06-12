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

wait_pb_health() {
  local base="$1"
  for i in $(seq 1 30); do
    if curl -sf "$base/api/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

hooks_need_reload() {
  local base="$1"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "$base/api/nuanban/captcha/challenge" || true)"
  [[ "$code" != "200" ]]
}

echo "==> 2/3 等待 API 就绪并校验 hooks（验证码路由）"
BASE="${NUANBAN_API:-http://localhost:8090}"
if ! wait_pb_health "$BASE"; then
  echo "超时：请执行 docker compose logs pocketbase"
  exit 1
fi
echo "    API OK: $BASE/api/health"

if hooks_need_reload "$BASE"; then
  echo "    hooks 未加载完整（captcha 404），重启 PocketBase 以挂载最新 pb_hooks…"
  docker compose restart pocketbase >/dev/null
  if ! wait_pb_health "$BASE"; then
    echo "重启后仍无法访问 API，请执行 docker compose logs pocketbase"
    exit 1
  fi
  if hooks_need_reload "$BASE"; then
    echo "错误: /api/nuanban/captcha/challenge 仍不可用，请检查 packages/pocketbase/pb_hooks"
    exit 1
  fi
  echo "    hooks 已重载（captcha OK）"
fi

echo "==> 3/3 写入测试数据（seed-demo）"
"$ROOT/scripts/seed-demo.sh"

echo ""
echo "=========================================="
echo " 后端已就绪（正式鉴权 · PocketBase 测试数据）"
echo "   API:   $BASE/api"
echo "   Admin: $BASE/_/"
echo "   NUANBAN_FORMAL_AUTH=true（无 000000 万能码 · 验证码见运营发件箱）"
echo ""
echo " 下一步（新开终端）："
echo "   ./scripts/start-h5.sh"
echo "   浏览器打开 http://localhost:5174/#/pages/common/login"
echo "   角标「正式版」· 完整短信流程（连点「暖」→ 运营 → 短信发件箱）"
echo "   万人压测数据: npm run stress:seed-10k（见 docs/STRESS_AND_FLOW_TEST.md）"
echo "   学生核验照落盘: dev-data/verification-photos/（拍照后生成）"
echo ""
"$ROOT/scripts/print-phone-dev-url.sh"
echo "详细说明: docs/LOCAL_TEST.md"
