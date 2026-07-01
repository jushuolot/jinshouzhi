#!/usr/bin/env bash
# 一条命令发布 — 自动识别环境（见 docs/RELEASE.md）
#
# 本地 Mac（开发完成后）:
#   ./scripts/sync-all.sh
#   → 发布测试版：推 GitHub，Actions 更新 Pages（不自动部署阿里云）
#
# 阿里云 Workbench（测试版验收通过后）:
#   cd /opt/jinshouzhi/nuanban_github && ./scripts/sync-all.sh
#   → 发布正式版：拉代码 + 重建 H5 + 重启服务
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

on_aliyun_server() {
  if [[ "${NUANBAN_REMOTE_DIR:-}" == "$ROOT" ]]; then
    return 0
  fi
  if [[ "$ROOT" == *"/opt/jinshouzhi/nuanban_github"* ]]; then
    return 0
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q '^nuanban-pocketbase$'; then
    return 0
  fi
  return 1
}

if on_aliyun_server; then
  exec "$ROOT/scripts/release-prod.sh"
fi

exec "$ROOT/scripts/release-test.sh"
