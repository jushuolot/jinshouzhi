#!/usr/bin/env bash
# 阿里云 Linux：卸载 podman-docker 占位，改装真正的 Docker CE + compose
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "请用 root 执行"
  exit 1
fi

PKG=dnf
command -v dnf >/dev/null || PKG=yum

echo "==> 1/4 移除 podman-docker 占位（若有）"
"$PKG" remove -y podman-docker 2>/dev/null || true

echo "==> 2/4 添加 Docker CE 源（阿里云镜像）"
"$PKG" install -y dnf-plugins-core 2>/dev/null || "$PKG" install -y yum-utils 2>/dev/null || true
if [[ ! -f /etc/yum.repos.d/docker-ce.repo ]]; then
  "$PKG" config-manager --add-repo https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
fi

echo "==> 3/4 安装 Docker CE + compose 插件"
"$PKG" makecache -y 2>/dev/null || true
"$PKG" install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

echo "==> 4/4 启动 Docker"
systemctl enable docker
systemctl start docker

docker --version
docker compose version
docker info | head -5

echo ""
echo "Docker CE 安装完成。请执行: ./scripts/deploy-staging.sh"
