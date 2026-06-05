#!/usr/bin/env bash
# 本地开发完成后：推代码并让云服务器拉取更新（无需本地保持终端）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

: "${NUANBAN_SSH:?请在 config/demo.env 设置 NUANBAN_SSH}"
: "${NUANBAN_REMOTE_DIR:?请在 config/demo.env 设置 NUANBAN_REMOTE_DIR}"

LOGIN_PATH="/#/pages/common/login"
DEMO_URL="${NUANBAN_DEMO_URL:-https://${NUANBAN_DOMAIN:-你的域名}${LOGIN_PATH}}"

echo "==> 推送代码到 GitHub"
git push origin main

echo "==> 云服务器拉取并部署"
ssh "$NUANBAN_SSH" "cd ${NUANBAN_REMOTE_DIR} && git pull && chmod +x scripts/*.sh && ./scripts/deploy-public.sh"

echo ""
echo "同步完成。客人固定链接: ${DEMO_URL}"
