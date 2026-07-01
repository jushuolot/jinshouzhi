#!/usr/bin/env bash
# 发布稳定版 → 仅部署阿里云（GitHub 发布版验收通过后执行）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

on_aliyun_server() {
  if [[ "${NUANBAN_REMOTE_DIR:-}" == "$ROOT" ]]; then
    return 0
  fi
  if [[ "$ROOT" == *"/opt/jinshouzhi/nuanban_github"* ]]; then
    return 0
  fi
  return 1
}

deploy_on_server() {
  GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
  "$ROOT/scripts/git-pull-cn.sh" "$GIT_ROOT"
  chmod +x scripts/*.sh

  SHA="$(git -C "$GIT_ROOT" rev-parse HEAD)"
  SHORT="$(git -C "$GIT_ROOT" rev-parse --short HEAD)"
  mkdir -p "$ROOT/.release"
  printf 'channel=stable\nsha=%s\nshort=%s\ndeployed_at=%s\n' \
    "$SHA" "$SHORT" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "$ROOT/.release/prod.lock"

  echo "==> 部署发布稳定版 $SHORT"
  "$ROOT/scripts/aliyun-fix-data.sh"

  echo ""
  echo "=============================================="
  echo "发布稳定版已部署: $SHORT"
  if [[ -n "${NUANBAN_DOMAIN:-}" ]]; then
    echo "  H5:  https://${NUANBAN_DOMAIN}/#/pages/common/login"
  else
    IP="${NUANBAN_STAGING_IP:-你的IP}"
    echo "  H5:  http://${IP}/#/pages/common/launch"
  fi
  echo "  登录页角标: 发布稳定版"
  echo "  请强刷浏览器 (Cmd+Shift+R)"
  echo "=============================================="
}

if on_aliyun_server; then
  echo "=============================================="
  echo "阿里云 · 发布稳定版"
  echo "=============================================="
  deploy_on_server
  exit 0
fi

if [[ -n "${NUANBAN_SSH:-}" && -n "${NUANBAN_REMOTE_DIR:-}" ]]; then
  echo "=============================================="
  echo "本地触发 · 阿里云发布稳定版"
  echo "=============================================="
  ssh "$NUANBAN_SSH" "cd ${NUANBAN_REMOTE_DIR} && ./scripts/release-prod.sh"
  exit 0
fi

echo "请在以下任一环境执行:"
echo "  1) 阿里云 Workbench: cd /opt/jinshouzhi/nuanban_github && ./scripts/release-prod.sh"
echo "  2) 本地配置 config/formal.env 中 NUANBAN_SSH + NUANBAN_REMOTE_DIR 后重试"
exit 1
