#!/usr/bin/env bash
# 压力 / 流程测试入口
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

MODE="${1:-smoke}"
export NUANBAN_API="${NUANBAN_API:-http://127.0.0.1:8090}"

health_ok() {
  curl -sf "${NUANBAN_API%/}/api/health" >/dev/null 2>&1
}

case "$MODE" in
  smoke)
    if ! health_ok; then
      echo "PocketBase 未运行，跳过 flow 脚本。"
      echo "  启动: ./scripts/dev-test.sh"
      exit 2
    fi
    node scripts/stress/flow-role-student.mjs
    node scripts/stress/flow-role-family.mjs
    node scripts/stress/flow-role-elder.mjs
    node scripts/stress/flow-role-ops.mjs
    ;;
  100)
    node scripts/stress/stress-100.mjs
    ;;
  2000)
    node scripts/stress/stress-2000.mjs
    ;;
  failures)
    node scripts/stress/simulate-failures.mjs
    ;;
  *)
    echo "用法: $0 [smoke|100|2000|failures]"
    exit 1
    ;;
esac
