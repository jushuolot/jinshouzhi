#!/usr/bin/env bash
# 本地 → GitHub → 阿里云（由 sync-all.sh 调用；也可单独运行）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

GIT_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"

echo "==> 1/3 拉取 GitHub 最新"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull

echo "==> 2/3 推送本地到 GitHub（若有新提交）"
if [[ -n "$(git -C "$GIT_ROOT" status --porcelain)" ]]; then
  echo "错误：有未提交改动，请先 git add && git commit"
  git -C "$GIT_ROOT" status -s
  exit 1
fi
AHEAD="$(git -C "$GIT_ROOT" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
if [[ "$AHEAD" -gt 0 ]]; then
  git -C "$GIT_ROOT" push origin main
else
  echo "    无需推送（已与 origin/main 同步）"
fi

echo "==> 3/3 阿里云部署"
if [[ -n "${NUANBAN_SSH:-}" && -n "${NUANBAN_REMOTE_DIR:-}" ]]; then
  ssh "$NUANBAN_SSH" "cd ${NUANBAN_REMOTE_DIR} && git pull && chmod +x scripts/*.sh && ./scripts/aliyun-fix-data.sh"
else
  echo "    未配置 SSH（config/demo.env 中 NUANBAN_SSH / NUANBAN_REMOTE_DIR）"
  echo "    请在阿里云 Workbench 手动执行："
  echo "    cd /opt/jinshouzhi/nuanban_github && git pull && ./scripts/aliyun-fix-data.sh"
fi

echo ""
./scripts/sync-check.sh
