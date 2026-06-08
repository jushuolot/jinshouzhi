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
  if ! echo "$body" | grep -q 'demo-tour'; then
    echo "FAIL: bundle missing required «demo-tour» (Pages may be stale — wait for Actions)"
    return 1
  fi
  echo "PASS: bundle contains required «demo-tour»"
  for token in '动画演示' '上帝视角' '有偿陪护'; do
    if echo "$body" | grep -q "$token"; then
      echo "PASS: bundle contains «$token»"
    else
      echo "WARN: bundle missing «$token»"
    fi
  done
  return 0
}

case "${1:-}" in
  --bundle) smoke_bundle ;;
  *) smoke_index ;;
esac
