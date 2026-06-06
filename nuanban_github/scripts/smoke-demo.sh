#!/usr/bin/env bash
# 公网演示冒烟：检查 GitHub Pages index 可访问
set -euo pipefail

URL="${NUANBAN_DEMO_URL:-https://jushuolot.github.io/jinshouzhi/nuanban/}"

code="$(curl -sf -o /dev/null -w '%{http_code}' "$URL" || echo '000')"
if [ "$code" = "200" ]; then
  echo "PASS: $URL → HTTP $code"
  exit 0
fi

echo "FAIL: $URL → HTTP $code"
exit 1
