#!/usr/bin/env bash
# 发布 GitHub 发布版 → push main，Actions 构建 Pages（角标「发布版」）
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
echo "发布 GitHub 发布版"
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
echo "发布版已推送，GitHub Actions 约 2～5 分钟后更新"
echo ""
echo "  验收: ${FORMAL_URL}"
echo "  构建: https://github.com/jushuolot/jinshouzhi/actions"
echo "  角标: 发布版 · 真实 API（与阿里云同库，见 docs/ENV_PARITY.md）"
echo "  API:  ${NUANBAN_FORMAL_API_URL:-https://101-200-128-82.sslip.io/api}（GitHub Variable: NUANBAN_FORMAL_API_URL）"
echo ""
echo "发布稳定版（阿里云）:"
echo "  ./scripts/release-prod.sh"
echo "=============================================="
