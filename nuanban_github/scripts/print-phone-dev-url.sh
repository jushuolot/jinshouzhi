#!/usr/bin/env bash
# 打印真机 / 模拟器可用的本地 H5 地址
set -euo pipefail

PORT="${NUANBAN_DEV_PORT:-5174}"
PATH_SUFFIX="/#/pages/common/launch"

pick_ip() {
  local ip=""
  for iface in en0 en1 bridge0; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      echo "$ip"
      return 0
    fi
  done
  return 1
}

echo "=============================================="
echo "暖伴 · 手机访问本地开发地址"
echo "=============================================="
echo ""
echo "先确认终端里 npm run dev:h5 正在运行。"
echo ""

IP="$(pick_ip || true)"
if [[ -n "$IP" ]]; then
  echo "【真机 iPhone · 与 Mac 同一 WiFi】"
  echo "  在 iPhone Safari 输入："
  echo "  http://${IP}:${PORT}${PATH_SUFFIX}"
  echo ""
else
  echo "【真机 iPhone】未检测到 WiFi IP（en0/en1）。"
  echo "  系统设置 → 网络 → Wi‑Fi → 详细信息 → IP 地址"
  echo "  然后访问: http://你的Mac的IP:${PORT}${PATH_SUFFIX}"
  echo ""
fi

echo "【Xcode iPhone 模拟器 Safari】"
echo "  http://127.0.0.1:${PORT}${PATH_SUFFIX}"
echo "  （模拟器里不要用 localhost 以外的复杂地址）"
echo ""
echo "【Mac 本机浏览器】"
echo "  http://localhost:${PORT}${PATH_SUFFIX}"
echo ""
echo "常见不通原因："
echo "  1. 真机用了 localhost（那是手机自己，不是 Mac）"
echo "  2. packages/miniapp/.env 里应是 VITE_API_BASE_URL=/api"
echo "     不要写 http://localhost:8090/api"
echo "  3. Mac 防火墙拦截 → 系统设置 → 网络 → 防火墙 → 允许 node"
echo "  4. 手机与 Mac 不在同一 WiFi"
echo "  5. dev 端口不是 5174（看 npm run dev:h5 终端输出）"
echo "  6. 页面不对 → 执行 ./scripts/start-h5.sh 释放 5174 并启动暖伴"
echo ""
echo "游客模式可先验 UI（不依赖后端）；登录需 ./scripts/dev-test.sh"
echo "=============================================="
