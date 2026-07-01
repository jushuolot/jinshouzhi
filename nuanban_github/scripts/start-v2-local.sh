#!/usr/bin/env bash
# V2 本地联调：检查后端 + 打印用户端/运营台启动说明（需开两个终端）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

USER_PORT="${NUANBAN_USER_PORT:-5174}"
CONTROL_PORT="${NUANBAN_CONTROL_PORT:-5175}"

echo "=============================================="
echo "暖伴 V2 · 本地走通（无需配置子域名）"
echo "=============================================="
echo ""
echo "若浏览器曾打开 /login 或仍见旧项目页面，请先: ./scripts/purge-legacy-dev.sh"
echo ""
echo "本地用「两个端口」代替公网子域名："
echo "  用户端   → http://localhost:${USER_PORT}   （相当于 user.nuanbao.cc）"
echo "  运营台   → http://localhost:${CONTROL_PORT} （相当于 control.nuanbao.cc）"
echo "  API      → http://localhost:8090            （两前端共用，Vite 代理 /api）"
echo ""

if ! curl -sf http://localhost:8090/api/health >/dev/null 2>&1; then
  echo "⚠ PocketBase 未运行。请先在一个终端执行："
  echo "   ./scripts/dev-test.sh"
  echo ""
else
  echo "✓ PocketBase 已就绪 (localhost:8090)"
fi

for p in "$USER_PORT" "$CONTROL_PORT"; do
  if lsof -ti :"$p" >/dev/null 2>&1; then
    echo "⚠ 端口 ${p} 已被占用，启动前请先关闭对应进程"
  fi
done

echo ""
echo "----------------------------------------------"
echo "终端 1 · 用户端"
echo "  cd ${ROOT}"
echo "  ./scripts/start-h5-user.sh"
echo "  打开: http://localhost:${USER_PORT}/#/pages/common/login"
echo ""
echo "终端 2 · 运营台"
echo "  cd ${ROOT}"
echo "  UNI_H5_PORT=${CONTROL_PORT} ./scripts/start-h5-control.sh"
echo "  打开: http://localhost:${CONTROL_PORT}/#/pages/common/ops-gate"
echo "  口令: nuanban2026（或 暖伴2026）"
echo "----------------------------------------------"
echo ""
echo "验收要点："
echo "  · 用户端登录页无「运营台」悬浮按钮、点「暖」无反应"
echo "  · 运营台可审核学生、派单、看 KPI"
echo "  · 测试号 13800000001，验证码见运营台「更多 → 短信发件箱」"
echo ""
echo "详细说明: docs/V2_WALKTHROUGH.md"
echo "=============================================="
