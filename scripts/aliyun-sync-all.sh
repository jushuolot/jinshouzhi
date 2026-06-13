#!/usr/bin/env bash
# 本地：push 代码 → 阿里云拉取 → 部署暖伴 + 同步古蜀秘档静态站
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f scripts/aliyun.env ]]; then
  # shellcheck disable=SC1091
  source scripts/aliyun.env
elif [[ -f nuanban_github/config/demo.env ]]; then
  # shellcheck disable=SC1091
  source nuanban_github/config/demo.env
  ALIYUN_SSH="${ALIYUN_SSH:-${NUANBAN_SSH:-}}"
  ALIYUN_REPO_DIR="${ALIYUN_REPO_DIR:-/opt/jinshouzhi}"
fi

: "${ALIYUN_SSH:?请配置 scripts/aliyun.env 或 nuanban_github/config/demo.env 中的 SSH}"
ALIYUN_REPO_DIR="${ALIYUN_REPO_DIR:-/opt/jinshouzhi}"
NUANBAN_REMOTE_DIR="${NUANBAN_REMOTE_DIR:-${ALIYUN_REPO_DIR}/nuanban_github}"
MATCH3_REMOTE_DIR="${MATCH3_REMOTE_DIR:-${ALIYUN_REPO_DIR}/match3-game}"
MATCH3_URL_PATH="${MATCH3_URL_PATH:-/game}"

DOMAIN="${ALIYUN_DOMAIN:-${NUANBAN_DOMAIN:-}}"
STAGING_IP="${ALIYUN_STAGING_IP:-${NUANBAN_STAGING_IP:-}}"

echo "==> 1/3 推送 GitHub (main)"
git push origin main

echo "==> 2/3 服务器拉取 ${ALIYUN_REPO_DIR}"
ssh "$ALIYUN_SSH" "set -e
  if [[ -d ${ALIYUN_REPO_DIR}/.git ]]; then
    git -C ${ALIYUN_REPO_DIR} pull --ff-only origin main
  else
    mkdir -p ${ALIYUN_REPO_DIR%/*}
    git clone https://github.com/jushuolot/jinshouzhi.git ${ALIYUN_REPO_DIR}
  fi
  test -d ${MATCH3_REMOTE_DIR} || { echo '缺少 match3-game 目录'; exit 1; }
  test -d ${NUANBAN_REMOTE_DIR} || { echo '缺少 nuanban_github 目录'; exit 1; }
"

echo "==> 3/3 部署暖伴 + 挂载古蜀秘档"
ssh "$ALIYUN_SSH" "set -e
  cd ${NUANBAN_REMOTE_DIR}
  chmod +x scripts/*.sh 2>/dev/null || true
  if [[ -f config/demo.env ]] && grep -q '^NUANBAN_DOMAIN=' config/demo.env 2>/dev/null; then
    ./scripts/deploy-public.sh
  elif [[ -f config/demo.env ]] && grep -q '^NUANBAN_STAGING_IP=' config/demo.env 2>/dev/null; then
    ./scripts/deploy-staging.sh
  else
    echo '未找到 NUANBAN_DOMAIN / NUANBAN_STAGING_IP，仅重载 Caddy 静态卷'
    docker compose -f docker-compose.yml -f docker-compose.prod.yml --profile full up -d caddy
  fi
"

echo ""
echo "=============================================="
echo "同步完成"
if [[ -n "$DOMAIN" ]]; then
  echo "  暖伴:     https://${DOMAIN}/#/pages/common/login"
  echo "  古蜀秘档: https://${DOMAIN}${MATCH3_URL_PATH}/"
elif [[ -n "$STAGING_IP" ]]; then
  echo "  暖伴:     http://${STAGING_IP}/#/pages/common/login"
  echo "  古蜀秘档: http://${STAGING_IP}${MATCH3_URL_PATH}/"
else
  echo "  请在 aliyun.env 设置 ALIYUN_DOMAIN 或 ALIYUN_STAGING_IP 查看链接"
fi
echo "=============================================="
