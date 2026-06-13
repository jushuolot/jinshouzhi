#!/usr/bin/env bash
# 阿里云 · 从零到可访问（备案中 HTTP 版）
# 在服务器 Workbench 执行，需 root
#
# 用法:
#   cd /opt/jinshouzhi/nuanban_github
#   ./scripts/aliyun-oneclick.sh
#   ./scripts/aliyun-oneclick.sh 101.200.128.82
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

STAGING_IP="${1:-${NUANBAN_STAGING_IP:-101.200.128.82}}"
DOMAIN="${NUANBAN_DOMAIN:-nuanban.cc}"

echo "=============================================="
echo " 暖伴勤工 · 阿里云一键部署"
echo " IP: ${STAGING_IP}  域名(备案后): ${DOMAIN}"
echo "=============================================="

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请用 root 执行，或: sudo $0"
  exit 1
fi

if ! command -v git >/dev/null 2>&1; then
  echo "==> 安装 git"
  (command -v dnf >/dev/null && dnf install -y git) || \
  (command -v yum >/dev/null && yum install -y git) || \
  (command -v apt-get >/dev/null && apt-get update && apt-get install -y git)
fi

if [[ ! -f docker-compose.yml ]] || [[ ! -d packages/miniapp ]]; then
  echo "错误: 请在 nuanban_github 目录执行，或先 git clone"
  exit 1
fi

echo "==> 拉取最新代码"
GIT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
git -C "$GIT_ROOT" pull --ff-only || git -C "$GIT_ROOT" pull

chmod +x scripts/*.sh

echo "==> 初始化环境（Docker + Node）"
./scripts/aliyun-bootstrap.sh

echo "==> 写入 config/demo.env"
cat > config/demo.env <<EOF
NUANBAN_DOMAIN=${DOMAIN}
NUANBAN_DEMO_URL=https://${DOMAIN}/#/pages/common/login
NUANBAN_STAGING_IP=${STAGING_IP}
NUANBAN_SSH=root@${STAGING_IP}
NUANBAN_REMOTE_DIR=${ROOT}
EOF

echo "==> 部署（约 5～10 分钟）"
./scripts/deploy-staging.sh

echo ""
echo "=============================================="
echo " 完成！浏览器打开:"
echo "   http://${STAGING_IP}/#/pages/common/login"
echo " 测试: 13800000005  验证码 000000"
echo "=============================================="
