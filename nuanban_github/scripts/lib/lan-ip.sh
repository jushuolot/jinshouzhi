#!/usr/bin/env bash
# 取 Mac 当前 WiFi/有线局域网 IP（供手机真机联调打印）
get_lan_ip() {
  local iface ip
  for iface in en0 en1; do
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" && "$ip" != 127.* ]]; then
      echo "$ip"
      return 0
    fi
  done
  return 1
}
