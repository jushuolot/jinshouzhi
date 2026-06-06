"""应用元信息（版本 / 进化步数）。"""

from __future__ import annotations

APP_VERSION = "2.6.0"
EVOLUTION_STEP = 360
EVOLUTION_PHASE = "P36"
BUILD_LABEL = f"{EVOLUTION_PHASE} · step {EVOLUTION_STEP}"

CHANGELOG: list[tuple[str, str]] = [
    ("P1–P4", "结构、模块化、一键分析、公网部署"),
    ("P5–P6", "持久化、自动刷新、合集导出、移动端"),
    ("P7–P8", "板块联动、朗读、快照、Webhook/多用户"),
    ("P9–P12", "推送日志、重试、健康告警、CSV/备份/百步进化"),
    ("P13–P15", "智能提醒、历史CSV、evolve_verify、评分徽章"),
    ("P16–P18", "双股对比、提醒 Webhook、?tab= 深链接、v2.0.0"),
    ("P19–P21", "自选分组、历史趋势、JSON 备份导入、v2.1.0"),
    ("P22–P24", "快捷筛选、定时摘要提醒、深色偏好、v2.2.0"),
    ("P25–P27", "板块热力图、批量操作、v2.3.0"),
    ("P28–P30", "自选笔记、摘要缓存、v2.4.0"),
    ("P31–P33", "笔记导出、健康面板增强、v2.5.0"),
    ("P34–P36", "搜索历史、提醒模板、v2.6.0"),
]
