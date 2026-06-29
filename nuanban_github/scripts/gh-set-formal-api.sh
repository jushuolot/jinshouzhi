#!/usr/bin/env bash
# 设置 GitHub Actions 变量 NUANBAN_FORMAL_API_URL（发布版 H5 远程 API）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/github.env ]]; then
  # shellcheck disable=SC1091
  source config/github.env
fi

API_URL="${1:-${NUANBAN_FORMAL_API_URL:-https://www.nuanbao.cc/api}}"

echo "==> 设置 GitHub Variable: NUANBAN_FORMAL_API_URL=$API_URL"
gh variable set NUANBAN_FORMAL_API_URL --body "$API_URL"
echo "完成。下次 push main 触发 Pages 构建时将注入 VITE_API_BASE_URL。"
