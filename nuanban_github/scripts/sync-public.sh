#!/usr/bin/env bash
# 发布正式版到阿里云（兼容旧名，等同 release-prod.sh）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec "$ROOT/scripts/release-prod.sh"
