#!/usr/bin/env bash
# 国内服务器：Docker Hub 拉取超时時配置镜像加速
set -euo pipefail
[[ "$(id -u)" -eq 0 ]] || { echo "请用 root 执行"; exit 1; }
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://registry.cn-hangzhou.aliyuncs.com"
  ]
}
EOF
systemctl restart docker
echo "镜像加速已配置，docker info | grep -A3 'Registry Mirrors'"
