#!/usr/bin/env bash
# 发布测试版到 GitHub（兼容旧名，等同 release-test.sh）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/release-test.sh"
