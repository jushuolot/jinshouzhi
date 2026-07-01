#!/usr/bin/env bash
# 加载阿里云正式环境配置（config/formal.env）
# 兼容旧名 config/demo.env（已废弃，会打印迁移提示）
source_formal_env() {
  local root="${1:?root dir required}"
  if [[ -f "$root/config/formal.env" ]]; then
    # shellcheck disable=SC1091
    source "$root/config/formal.env"
    return 0
  fi
  if [[ -f "$root/config/demo.env" ]]; then
    echo "提示: config/demo.env 已更名为 config/formal.env，请执行: cp config/demo.env config/formal.env" >&2
    # shellcheck disable=SC1091
    source "$root/config/demo.env"
    return 0
  fi
  return 1
}

# 正式版 H5 入口（兼容旧变量 NUANBAN_DEMO_URL）
resolve_formal_url() {
  if [[ -n "${NUANBAN_FORMAL_URL:-}" ]]; then
    printf '%s' "$NUANBAN_FORMAL_URL"
  elif [[ -n "${NUANBAN_DEMO_URL:-}" ]]; then
    printf '%s' "$NUANBAN_DEMO_URL"
  else
    printf '%s' "${1:-}"
  fi
}
