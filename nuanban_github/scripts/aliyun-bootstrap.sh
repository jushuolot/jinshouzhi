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
  echo "错误：未找到 apt-get / yum / dnf"
  exit 1
fi
echo "    系统包管理: ${PKG}"

is_alinux() {
  [[ -f /etc/alinux-release ]] || grep -qi 'alinux\|alibaba cloud linux' /etc/os-release 2>/dev/null
}

docker_ready() {
  command -v docker >/dev/null 2>&1 \
    && docker info >/dev/null 2>&1 \
    && docker compose version >/dev/null 2>&1
}

install_docker_ce_aliyun() {
  echo "    从阿里云镜像安装 Docker CE（避免 podman-docker 占位）"
  "$PKG" install -y dnf-plugins-core 2>/dev/null || "$PKG" install -y yum-utils 2>/dev/null || true
  if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
    "$PKG" config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
  fi
  "$PKG" makecache -y 2>/dev/null || true
  "$PKG" install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
}

install_docker() {
  if docker_ready; then
    echo "    Docker 已就绪: $(docker --version)"
    echo "    Compose: $(docker compose version)"
    return 0
  fi
  # 系统源的 docker 常是 podman-docker，无 docker.service / compose 插件
  if is_alinux || [[ "$PKG" == dnf ]] || [[ "$PKG" == yum ]]; then
    install_docker_ce_aliyun
  else
    curl -fsSL https://get.docker.com | sh
    "$PKG" install -y docker-compose-plugin 2>/dev/null || true
  fi
  systemctl enable docker
  systemctl start docker
  if ! docker_ready; then
    echo "错误：Docker 或 docker compose 未就绪"
    echo "  请手动执行: systemctl status docker && docker compose version"
    exit 1
  fi
  echo "    Docker 就绪: $(docker --version)"
  echo "    Compose: $(docker compose version)"
}

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
install_docker

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
  echo "    Node $(node -v)"
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
  echo "    已复制 config/demo.env.example → 请设置 IP/域名"
else
  echo "    config/demo.env 已存在，跳过"
fi

echo "==> 6/6 完成"
echo ""
echo "=============================================="
echo "初始化完成。下一步:"
echo "    cd ${ROOT}"
echo "    ./scripts/aliyun-oneclick.sh   # 一键部署（备案中）"
echo "    或 ./scripts/deploy-staging.sh"
echo "=============================================="
