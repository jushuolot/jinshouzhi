#!/usr/bin/env bash
# 构建用户端或运营端 H5：./scripts/build-h5-variant.sh user|control
set -euo pipefail

VARIANT="${1:-}"
if [[ "$VARIANT" != "user" && "$VARIANT" != "control" ]]; then
  echo "用法: $0 user|control"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/packages/miniapp"

# shellcheck source=lib/source-formal-env.sh
. "$ROOT/scripts/lib/source-formal-env.sh"
source_formal_env "$ROOT" || true

node "$ROOT/scripts/prepare-pages-json.mjs" "$VARIANT"

if [[ ! -d node_modules ]]; then
  npm install
fi

export VITE_APP_VARIANT="$VARIANT"

# 变体构建默认走 stable；调用方可覆盖 VITE_RELEASE_CHANNEL / VITE_API_BASE_URL
: "${VITE_RELEASE_CHANNEL:=stable}"
export VITE_RELEASE_CHANNEL

npm run build:h5

DIST_BASE="$ROOT/packages/miniapp/dist/build"
OUT_DIR="$DIST_BASE/h5-$VARIANT"
rm -rf "$OUT_DIR"
mv "$DIST_BASE/h5" "$OUT_DIR"

echo "✓ h5-$VARIANT → $OUT_DIR"
