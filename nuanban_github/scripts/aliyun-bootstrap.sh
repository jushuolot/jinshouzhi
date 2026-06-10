#!/usr/bin/env bash
# 阿里云服务器 · 首次初始化（Ubuntu / Alibaba Cloud Linux / CentOS）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> 暖伴勤工 · 阿里云服务器初始化"
echo "    项目目录: $ROOT"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请使用 root 或 sudo 运行本脚本"
  exit 1
fi

PKG=""
if command -v apt-get >/dev/null 2>&1; then
  PKG=apt
elif command -v dnf >/dev/null 2>&1; then
  PKG=dnf
elif command -v yum >/dev/null 2>&1; then
  PKG=yum
else
  echo "错误：未找到 apt-get / yum / dnf，请手动安装 Docker 与 Node.js 20"
  exit 1
fi
echo "    系统包管理: ${PKG}"

echo "==> 1/6 系统更新与基础工具"
case "$PKG" in
  apt)
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y -qq curl wget git ca-certificates gnupg openssl
    ;;
  dnf)
    dnf install -y curl wget git ca-certificates openssl
    ;;
  yum)
    yum install -y curl wget git ca-certificates openssl
    ;;
esac

echo "==> 2/6 安装 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "    Docker 已安装，跳过"
fi

echo "==> 3/6 安装 Node.js 20（构建 H5）"
need_node=1
if command -v node >/dev/null 2>&1; then
  major="$(node -v | cut -d. -f1 | tr -d v)"
  if [[ "$major" -ge 18 ]]; then
    need_node=0
    echo "    Node $(node -v) 已满足，跳过"
  fi
fi
if [[ "$need_node" -eq 1 ]]; then
  case "$PKG" in
    apt)
      curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
      apt-get install -y -qq nodejs
      ;;
    dnf|yum)
      curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
      "$PKG" install -y nodejs
      ;;
  esac
fi

echo "==> 4/6 生成生产 .env（PocketBase 加密密钥）"
if [[ ! -f .env ]]; then
  PB_KEY="$(openssl rand -hex 16)"
  cat > .env <<EOF
# 生产密钥 · 勿提交 git · 更换后旧 pb_data 将无法解密
PB_ENCRYPTION_KEY=${PB_KEY}
EOF
  chmod 600 .env
  echo "    已写入 .env"
else
  echo "    .env 已存在，跳过"
fi

echo "==> 5/6 配置 config/demo.env"
if [[ ! -f config/demo.env ]]; then
  cp config/demo.env.example config/demo.env
  echo ""
  echo "    请编辑 config/demo.env，至少设置："
  echo "      NUANBAN_DOMAIN=你的备案域名（如 nuanban.cc）"
  echo "      NUANBAN_STAGING_IP=本机公网IP"
  echo "      NUANBAN_SSH=root@本机公网IP"
  echo "      NUANBAN_REMOTE_DIR=${ROOT}"
  echo ""
  echo "    编辑命令: nano config/demo.env"
else
  echo "    config/demo.env 已存在，跳过"
fi

echo "==> 6/6 防火墙提示"
echo ""
echo "=============================================="
echo "初始化完成。备案中临时部署:"
echo "    cd ${ROOT}"
echo "    ./scripts/deploy-staging.sh"
echo ""
echo "备案通过后正式 HTTPS:"
echo "    ./scripts/deploy-public.sh"
echo "=============================================="
