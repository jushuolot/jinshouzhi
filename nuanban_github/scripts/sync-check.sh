#!/usr/bin/env bash
# 三地一致性检测：本地 / GitHub / 阿里云（代码 + API）
# 用法：
#   ./scripts/sync-check.sh              # 本地：对比 Git + 测本机或公网 API
#   NUANBAN_API=http://127.0.0.1:8090 ./scripts/sync-check.sh   # 阿里云服务器上
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -f config/demo.env ]]; then
  # shellcheck disable=SC1091
  source config/demo.env
fi

STAGING_IP="${NUANBAN_STAGING_IP:-}"
PUBLIC_API="${NUANBAN_PUBLIC_API:-}"
if [[ -z "$PUBLIC_API" && -n "$STAGING_IP" ]]; then
  PUBLIC_API="http://${STAGING_IP}"
fi
LOCAL_API="${NUANBAN_API:-http://127.0.0.1:8090}"

FAIL=0
warn() { echo "  ⚠ $*"; FAIL=1; }
ok() { echo "  ✓ $*"; }
section() { echo ""; echo "==> $1"; }

section "1/4 关键文件（hooks 修复）"
for f in packages/pocketbase/pb_hooks/nuanban_lib.js \
         packages/pocketbase/pb_hooks/nuanban.pb.js \
         packages/pocketbase/pb_hooks/seed_demo.pb.js \
         scripts/pb-smoke-student.sh \
         scripts/aliyun-fix-data.sh \
         scripts/sync-all.sh \
         scripts/git-pull-cn.sh; do
  if [[ -f "$f" ]]; then ok "$f"; else warn "缺少 $f"; fi
done
if grep -q 'require(__hooks + "/nuanban_lib.js")' packages/pocketbase/pb_hooks/nuanban.pb.js 2>/dev/null; then
  ok "nuanban.pb.js 已 require nuanban_lib.js"
else
  warn "nuanban.pb.js 未 require nuanban_lib.js（旧 hooks，API 会报错）"
fi
if grep -q 'platform/overview' packages/pocketbase/pb_hooks/nuanban.pb.js 2>/dev/null; then
  ok "platform/overview 运营看板 API 已注册"
else
  warn "platform/overview 可能缺失"
fi

section "2/4 Git 与 GitHub"
GIT_ROOT="$(git -C "$ROOT" rev-parse --show-toplevel 2>/dev/null || echo "$ROOT")"
git -C "$GIT_ROOT" fetch origin main -q 2>/dev/null || warn "无法 fetch origin（检查网络）"
LOCAL_SHA="$(git -C "$GIT_ROOT" rev-parse --short HEAD 2>/dev/null || echo none)"
REMOTE_SHA="$(git -C "$GIT_ROOT" rev-parse --short origin/main 2>/dev/null || echo none)"
echo "  本地 HEAD:    $LOCAL_SHA"
echo "  origin/main:  $REMOTE_SHA"
if [[ "$LOCAL_SHA" == "$REMOTE_SHA" ]]; then
  ok "本地与 GitHub main 一致"
else
  AHEAD="$(git -C "$GIT_ROOT" rev-list --count origin/main..HEAD 2>/dev/null || echo 0)"
  BEHIND="$(git -C "$GIT_ROOT" rev-list --count HEAD..origin/main 2>/dev/null || echo 0)"
  if [[ "$BEHIND" -gt 0 ]]; then
    warn "本地落后 GitHub $BEHIND 个提交 → 执行: git pull"
  fi
  if [[ "$AHEAD" -gt 0 ]]; then
    warn "本地领先 GitHub $AHEAD 个提交 → 执行: git push"
  fi
fi
if [[ -n "$(git -C "$GIT_ROOT" status --porcelain -- nuanban_github/ 2>/dev/null)" ]]; then
  warn "nuanban_github 有未提交改动"
else
  ok "工作区干净（nuanban_github）"
fi

section "3/4 PocketBase API 冒烟（本机 ${LOCAL_API}）"
if curl -sf "${LOCAL_API%/}/api/health" >/dev/null 2>&1; then
  if NUANBAN_API="$LOCAL_API" ./scripts/pb-smoke-student.sh; then
    ok "本机 API 冒烟通过"
  else
    warn "本机 API 冒烟失败 → ./scripts/aliyun-fix-data.sh 或 docker compose restart pocketbase"
  fi
else
  echo "  （跳过：本机 PocketBase 未运行）"
fi

section "4/4 阿里云公网 API（${PUBLIC_API:-未配置}）"
if [[ -n "$PUBLIC_API" ]]; then
  if curl -sf "${PUBLIC_API%/}/api/health" >/dev/null 2>&1; then
    if NUANBAN_API="$PUBLIC_API" ./scripts/pb-smoke-student.sh; then
      ok "公网 API 冒烟通过"
    else
      warn "公网 API 冒烟失败 → 在服务器执行: git pull && ./scripts/aliyun-fix-data.sh"
    fi
  else
    warn "无法访问 ${PUBLIC_API}/api/health"
  fi
else
  echo "  （跳过：在 config/demo.env 设置 NUANBAN_STAGING_IP 或 NUANBAN_PUBLIC_API）"
fi

echo ""
if [[ "$FAIL" -eq 0 ]]; then
  echo "=============================================="
  echo "三地检测通过（代码 + API）"
  echo "=============================================="
else
  echo "=============================================="
  echo "存在不一致，请按上方提示修复"
  echo ""
  echo "推荐发布流程（见 docs/RELEASE.md）："
  echo "  测试版: ./scripts/release-test.sh"
  echo "  正式版: ./scripts/release-prod.sh"
  echo "  版本对比: ./scripts/release-status.sh"
  echo "=============================================="
  exit 1
fi
