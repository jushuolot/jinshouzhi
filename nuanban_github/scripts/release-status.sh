#!/usr/bin/env bash
# 对比发布版（GitHub Pages）与发布稳定版（阿里云已部署）版本
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/github.env ]]; then
  # shellcheck disable=SC1091
  source config/github.env
fi
# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

GIT_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
TEST_URL="$(resolve_formal_url "https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login")"
PROD_URL="$(resolve_formal_url "http://${NUANBAN_STAGING_IP:-101.200.128.82}/#/pages/common/login")"

git -C "$GIT_ROOT" fetch origin main -q 2>/dev/null || true
LOCAL="$(git -C "$GIT_ROOT" rev-parse --short HEAD 2>/dev/null || echo none)"
GITHUB="$(git -C "$GIT_ROOT" rev-parse --short origin/main 2>/dev/null || echo none)"

PROD_SHA="未部署"
PROD_AT=""
if [[ -f "$ROOT/.release/prod.lock" ]]; then
  PROD_SHA="$(grep '^short=' "$ROOT/.release/prod.lock" 2>/dev/null | cut -d= -f2 || echo unknown)"
  PROD_AT="$(grep '^deployed_at=' "$ROOT/.release/prod.lock" 2>/dev/null | cut -d= -f2 || echo '')"
elif [[ -n "${NUANBAN_SSH:-}" && -n "${NUANBAN_REMOTE_DIR:-}" ]]; then
  REMOTE_LOCK="$(ssh "$NUANBAN_SSH" "cat ${NUANBAN_REMOTE_DIR}/.release/prod.lock 2>/dev/null" || true)"
  if [[ -n "$REMOTE_LOCK" ]]; then
    PROD_SHA="$(echo "$REMOTE_LOCK" | grep '^short=' | cut -d= -f2)"
    PROD_AT="$(echo "$REMOTE_LOCK" | grep '^deployed_at=' | cut -d= -f2)"
  fi
fi

echo "=============================================="
echo "暖伴勤工 · 版本状态"
echo "=============================================="
echo ""
echo "【发布版 · GitHub Pages】"
echo "  链接:   ${TEST_URL}"
echo "  main:   ${GITHUB}"
echo "  本地:   ${LOCAL}"
echo ""
echo "【发布稳定版 · 阿里云】"
echo "  链接:   ${PROD_URL}"
echo "  已部署: ${PROD_SHA}"
if [[ -n "$PROD_AT" ]]; then
  echo "  时间:   ${PROD_AT}"
fi
echo ""

if [[ "$GITHUB" == "$PROD_SHA" ]]; then
  echo "✓ 发布版与发布稳定版提交一致"
elif [[ "$PROD_SHA" == "未部署" ]]; then
  echo "→ 发布稳定版尚未部署，验收发布版后执行: ./scripts/release-prod.sh"
else
  echo "→ 发布稳定版落后于发布版，验收后执行: ./scripts/release-prod.sh"
fi
echo "=============================================="
