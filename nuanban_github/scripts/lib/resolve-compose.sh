#!/usr/bin/env bash
# 识别当前服务器用的是备案 HTTPS（prod）还是 IP 临时（staging）
# shellcheck disable=SC2034
resolve_nuanban_compose() {
  local root="${1:?root dir}"
  if [[ -f "${root}/Caddyfile.prod" ]]; then
    NUANBAN_COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)
    NUANBAN_CADDY_PROFILE=full
    NUANBAN_DEPLOY_MODE=prod
  else
    NUANBAN_COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.staging.yml)
    NUANBAN_CADDY_PROFILE=staging
    NUANBAN_DEPLOY_MODE=staging
  fi
}
