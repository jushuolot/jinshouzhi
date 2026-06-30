#!/usr/bin/env bash
# 清空并重新写入演示数据
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
"$ROOT/scripts/clear-demo.sh" --reseed
echo ""
echo "==> 重启 PocketBase（清空内存中的钱包/验证码缓存）"
docker compose -f "$ROOT/docker-compose.yml" restart pocketbase
sleep 2
curl -sf "${NUANBAN_API:-http://localhost:8090}/api/health" >/dev/null && echo "API 就绪"
