#!/usr/bin/env bash
# 阿里云服务器：拉代码 → 重启后端 → 导入集合 + 演示数据（一条命令）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
echo "==> 拉取最新代码"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull

chmod +x scripts/*.sh

COMPOSE=(docker compose -f docker-compose.yml -f docker-compose.staging.yml)
echo "==> 重启 PocketBase（加载最新 hooks）"
"${COMPOSE[@]}" restart pocketbase
sleep 3

NUANBAN_API=http://127.0.0.1:8090 ./scripts/pb-init-server.sh

echo ""
echo "完成。请刷新: http://101.200.128.82/#/pages/common/login"
echo "测试: 13800000001 验证码留空"
