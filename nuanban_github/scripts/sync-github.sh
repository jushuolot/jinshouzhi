#!/usr/bin/env bash
# 本地改完 → 推 GitHub → Actions 自动发布 Pages；API 在 Render 常驻
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/github.env ]]; then
  # shellcheck disable=SC1091
  source config/github.env
fi

DEMO_URL="${NUANBAN_DEMO_URL:-https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login}"

echo "==> 推送到 GitHub（触发 Pages 自动构建）"
git push origin main

echo ""
echo "=============================================="
echo "已推送。约 2～5 分钟后 Pages 更新完成。"
echo ""
echo "  客人固定链接: ${DEMO_URL}"
echo ""
echo "  查看构建: https://github.com/jushuolot/jinshouzhi/actions"
echo "  首次部署见 docs/GITHUB_DEMO.md"
echo "=============================================="
