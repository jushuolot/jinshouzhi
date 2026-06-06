#!/usr/bin/env bash
# Agent 发货前检查：构建 H5 + 路由校验 + 提醒 git 状态
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# monorepo git 根：nuanban_github 的上一级
GIT_ROOT="$(cd "$ROOT/.." && pwd)"

echo "==> 暖伴 agent-ship"
echo "    app:  $ROOT"
echo "    git:  $GIT_ROOT"

echo "==> 1/4 路由校验"
node "$ROOT/scripts/check-routes.mjs"

echo "==> 2/4 构建 H5"
(cd "$ROOT/packages/miniapp" && npm run build:h5)

echo "==> 3/4 Git 状态（nuanban_github）"
(cd "$GIT_ROOT" && git status -sb -- nuanban_github/ docs/nuanban/ 2>/dev/null || git status -sb)

echo "==> 4/4 公网冒烟"
if bash "$ROOT/scripts/smoke-demo.sh"; then
  echo "    smoke: OK"
else
  echo "    smoke: WARN (network fail or Pages not ready)" >&2
fi

echo ""
echo "=========================================="
echo " 若上面有未提交改动，请在 git 根目录执行："
echo "   cd $GIT_ROOT"
echo "   git add nuanban_github/..."
echo "   git commit -m 'feat(nuanban): ...'"
echo "   git pull --rebase origin main && git push origin main"
echo ""
echo " 公网验收："
echo "   https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login"
echo "=========================================="
