#!/usr/bin/env bash
# 公网演示冒烟：index HTTP 200；可选 --bundle 检查已部署 JS 含关键演示标记
set -euo pipefail

BASE="${NUANBAN_DEMO_URL:-https://jushuolot.github.io/jinshouzhi/nuanban/}"

smoke_index() {
  local code
  code="$(curl -sf -o /dev/null -w '%{http_code}' "$BASE" || echo '000')"
  if [ "$code" = "200" ]; then
    echo "PASS: $BASE → HTTP $code"
    return 0
  fi
  echo "FAIL: $BASE → HTTP $code"
  return 1
}

smoke_bundle() {
  local html login_js
  html="$(curl -sf "$BASE" || true)"
  login_js="$(echo "$html" | grep -o 'pages-common-login[^"]*\.js' | head -1)"
  if [ -z "$login_js" ]; then
    echo "WARN: cannot find login chunk in index.html"
    return 1
  fi
  local body
  body="$(curl -sf "${BASE}assets/${login_js}" || true)"
  local ok=0
  for token in 'demo-tour' '动画演示' '上帝视角' '有偿陪护'; do
    if echo "$body" | grep -q "$token"; then
      echo "PASS: bundle contains «$token»"
      ok=1
    else
      echo "WARN: bundle missing «$token» (Pages may be stale — wait for Actions)"
    fi
  done
  [ "$ok" -eq 1 ]
}

case "${1:-}" in
  --bundle) smoke_bundle ;;
  *) smoke_index ;;
esac
