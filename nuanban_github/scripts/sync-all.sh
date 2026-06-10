#!/usr/bin/env bash
# 一条命令完成「日常同步」——自动识别你在本地还是阿里云
#
# 本地 Mac（改完代码并 commit 后）:
#   ./scripts/sync-all.sh
#   → 推 GitHub；若配置了 SSH 则连阿里云一起部署，否则打印 Workbench 一条命令
#
# 阿里云 Workbench（最常见，复制粘贴一次即可）:
#   cd /opt/jinshouzhi/nuanban_github && ./scripts/sync-all.sh
#   → git pull + 重启服务 + 演示数据 + 重建 H5 + 自检
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

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
  echo "=============================================="
  echo "阿里云 · 一条命令同步（GitHub → 本机部署）"
  echo "=============================================="
  exec "$ROOT/scripts/aliyun-fix-data.sh"
fi

echo "=============================================="
echo "本地 · 一条命令同步（本地 → GitHub → 阿里云）"
echo "=============================================="
exec "$ROOT/scripts/sync-three-way.sh"
