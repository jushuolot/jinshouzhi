#!/usr/bin/env bash
# 发布测试版 → 推送到 GitHub，由 Actions 自动部署 GitHub Pages
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/github.env ]]; then
  # shellcheck disable=SC1091
  source config/github.env
fi

GIT_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
TEST_URL="${NUANBAN_DEMO_URL:-https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch}"

echo "=============================================="
echo "发布测试版（GitHub Pages）"
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
echo "测试版已推送，GitHub Actions 约 2～5 分钟后更新"
echo ""
echo "  验收链接: ${TEST_URL}"
echo "  构建状态: https://github.com/jushuolot/jinshouzhi/actions"
echo "  登录页角标: 测试版"
echo ""
echo "验收通过后发布正式版:"
echo "  ./scripts/release-prod.sh"
echo "=============================================="
