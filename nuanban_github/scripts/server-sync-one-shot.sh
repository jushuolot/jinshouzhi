#!/usr/bin/env bash
# 阿里云 Workbench 一条命令：镜像拉代码 + 全量部署（即使尚未有 sync-all.sh 也能用）
# 用法: curl -fsSL 不可用，请在本机 git pull 后执行:
#   bash /opt/jinshouzhi/nuanban_github/scripts/server-sync-one-shot.sh
set -euo pipefail

git config --global url."https://ghfast.top/https://github.com/".insteadOf "https://github.com/" 2>/dev/null || true
git config --global http.postBuffer 524288000 2>/dev/null || true

cd /opt/jinshouzhi
echo "==> 拉取 GitHub（浅拉取）"
git fetch --depth=1 origin main
git reset --hard origin/main

cd /opt/jinshouzhi/nuanban_github
chmod +x scripts/*.sh
if [[ -x scripts/sync-all.sh ]]; then
  ./scripts/sync-all.sh
else
  ./scripts/aliyun-fix-data.sh
fi
