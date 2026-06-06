"""应用元信息（版本 / 进化步数）。"""

from __future__ import annotations

APP_VERSION = "1.8.0"
EVOLUTION_STEP = 120
EVOLUTION_PHASE = "P12"
BUILD_LABEL = f"{EVOLUTION_PHASE} · step {EVOLUTION_STEP}"

CHANGELOG: list[tuple[str, str]] = [
    ("P1–P4", "结构、模块化、一键分析、公网部署"),
    ("P5–P6", "持久化、自动刷新、合集导出、移动端"),
    ("P7–P8", "板块联动、朗读、快照、Webhook/多用户"),
    ("P9–P12", "推送日志、重试、健康告警、CSV/备份/百步进化"),
]
