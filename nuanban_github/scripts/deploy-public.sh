#!/usr/bin/env bash
# 在云服务器上部署/更新公网演示站（V2：user + control 子域）
# 首次：配置 config/formal.env + .env(PB_ENCRYPTION_KEY) 后执行本脚本
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

exec "$ROOT/scripts/deploy-v2.sh"
