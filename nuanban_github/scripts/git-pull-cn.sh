#!/usr/bin/env bash
# 国内服务器从 GitHub 拉代码（重试 + 镜像加速）
# 用法: ./scripts/git-pull-cn.sh [git仓库根目录，默认自动检测]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
GIT_ROOT="${1:-$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")}"

cd "$GIT_ROOT"

# 加大缓冲，降低大仓库 pull 失败概率
git config --global http.postBuffer 524288000 2>/dev/null || true
git config --global http.lowSpeedLimit 0 2>/dev/null || true
git config --global http.lowSpeedTime 999999 2>/dev/null || true

ORIGIN_URL="$(git remote get-url origin 2>/dev/null || echo "")"
if [[ "$ORIGIN_URL" == *"github.com"* ]]; then
  # 持久使用 ghfast 镜像（与 Dockerfile 一致）
  git config --global url."https://ghfast.top/https://github.com/".insteadOf "https://github.com/" 2>/dev/null || true
fi

pull_once() {
  git pull --ff-only "$@" 2>/dev/null || git pull "$@"
}

echo "==> 从 GitHub 拉取（$GIT_ROOT）"
for attempt in 1 2 3; do
  echo "    尝试 $attempt/3 ..."
  if pull_once; then
    echo "    拉取成功 @ $(git rev-parse --short HEAD)"
    exit 0
  fi
  sleep "$((attempt * 3))"
done

echo "错误：git pull 失败（国内访问 GitHub 不稳定）"
echo ""
echo "请手动执行以下任一方案后重试："
echo ""
echo "  方案 A（推荐，配置镜像后重试）"
echo "    git config --global url.\"https://ghfast.top/https://github.com/\".insteadOf \"https://github.com/\""
echo "    cd $GIT_ROOT && git pull"
echo ""
echo "  方案 B（浅拉取，数据量小）"
echo "    cd $GIT_ROOT && git fetch --depth=1 origin main && git reset --hard origin/main"
echo ""
echo "  方案 C（换时段或开代理后再 pull）"
exit 1
