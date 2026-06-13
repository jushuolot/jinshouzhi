#!/usr/bin/env bash
# 确保 packages/miniapp/.env 为本地 parity（PocketBase 测试数据，非浏览器 Mock）
ensure_parity_env() {
  local root="$1"
  local env_file="$root/packages/miniapp/.env"
  local env_example="$root/packages/miniapp/.env.example"

  if [ ! -f "$env_file" ]; then
    cp "$env_example" "$env_file"
    echo "    已从 .env.example 创建 packages/miniapp/.env（VITE_DEMO_MOCK=false）"
    return 0
  fi

  local changed=0
  for key in VITE_RELEASE_CHANNEL VITE_DEMO_MOCK VITE_API_BASE_URL; do
    if ! grep -q "^${key}=" "$env_file" 2>/dev/null; then
      grep "^${key}=" "$env_example" >> "$env_file" 2>/dev/null || true
      echo "    已补全 .env: ${key}"
      changed=1
    fi
  done

  if grep -q '^VITE_DEMO_MOCK=' "$env_file" && ! grep -q '^VITE_DEMO_MOCK=false' "$env_file"; then
    local tmp="${env_file}.tmp.$$"
    awk 'BEGIN{done=0} /^VITE_DEMO_MOCK=/{print "VITE_DEMO_MOCK=false"; done=1; next} {print} END{if(!done) print "VITE_DEMO_MOCK=false"}' \
      "$env_file" > "$tmp"
    mv "$tmp" "$env_file"
    echo "    已修正 .env: VITE_DEMO_MOCK=false（本地默认走 PocketBase 测试数据）"
    changed=1
  fi

  if grep -q '^VITE_RELEASE_CHANNEL=' "$env_file" && ! grep -q '^VITE_RELEASE_CHANNEL=formal' "$env_file"; then
    local tmp="${env_file}.tmp.$$"
    awk 'BEGIN{done=0} /^VITE_RELEASE_CHANNEL=/{print "VITE_RELEASE_CHANNEL=formal"; done=1; next} {print} END{if(!done) print "VITE_RELEASE_CHANNEL=formal"}' \
      "$env_file" > "$tmp"
    mv "$tmp" "$env_file"
    echo "    已修正 .env: VITE_RELEASE_CHANNEL=formal（本地正式产品流程，无演示捷径）"
    changed=1
  fi

  if [ "$changed" -eq 0 ] && grep -q '^VITE_DEMO_MOCK=false' "$env_file" && grep -q '^VITE_RELEASE_CHANNEL=formal' "$env_file"; then
    : # already parity
  fi
}
