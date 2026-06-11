#!/usr/bin/env bash
# 发布 GitHub 正式版（正式制作环境）→ push main，Actions 构建 Pages
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/github.env ]]; then
  # shellcheck disable=SC1091
  source config/github.env
fi

GIT_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
FORMAL_URL="${NUANBAN_DEMO_URL:-https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch}"

echo "=============================================="
echo "发布 GitHub 正式版（正式制作）"
echo "=============================================="

if [[ -n "$(git -C "$GIT_ROOT" status --porcelain)" ]]; then
  echo "错误：有未提交改动，请先 git add && git commit"
  git -C "$GIT_ROOT" status -s
  exit 1
fi

echo "==> 拉取 origin/main"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull

SHA="$(git -C "$GIT_ROOT" rev-parse --short HEAD)"
echo "==> 推送 main（$SHA）"
git -C "$GIT_ROOT" push origin main

echo ""
echo "=============================================="
echo "正式版已推送，GitHub Actions 约 2～5 分钟后更新"
echo ""
echo "  验收: ${FORMAL_URL}"
echo "  构建: https://github.com/jushuolot/jinshouzhi/actions"
echo "  角标: 正式版 · 游客 Mock · 登录走真实 API"
echo ""
echo "请确认仓库 Variable 已设: NUANBAN_FORMAL_API_URL"
echo "对外发布（阿里云）:"
echo "  ./scripts/release-prod.sh"
echo "=============================================="
