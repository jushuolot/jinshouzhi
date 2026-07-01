#!/usr/bin/env bash
# 释放指定端口（仅 kill 监听该端口的 node/vite 进程）
free_port() {
  local port="$1"
  local pids
  pids="$(lsof -ti :"${port}" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "    释放端口 ${port}: $pids"
    kill -9 $pids 2>/dev/null || true
    sleep 0.3
  fi
}
