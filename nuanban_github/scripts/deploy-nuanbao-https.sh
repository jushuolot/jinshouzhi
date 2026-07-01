#!/usr/bin/env bash
# 备案通过后 · 一键切换 HTTPS 正式域（在阿里云 Workbench 以 root 执行）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

cat > config/formal.env <<'EOF'
NUANBAN_DOMAIN=nuanbao.cc
NUANBAN_USER_HOST=user.nuanbao.cc
NUANBAN_CONTROL_HOST=control.nuanbao.cc
NUANBAN_FORMAL_URL=https://user.nuanbao.cc/#/pages/common/login
NUANBAN_PUBLIC_API=https://user.nuanbao.cc
NUANBAN_STAGING_IP=101.200.128.82
NUANBAN_REMOTE_DIR=/opt/jinshouzhi/nuanban_github
EOF

echo "==> 拉取最新代码"
GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull
chmod +x scripts/*.sh

echo "==> 部署 HTTPS（nuanbao.cc + www.nuanbao.cc）"
echo "    请确认安全组已放行 TCP 80、443"
./scripts/deploy-public.sh
