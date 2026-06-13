# 暖伴勤工 · 迭代路线图

> [GAP_AUDIT.md](./GAP_AUDIT.md) · [TEST_MATURITY.md](./TEST_MATURITY.md) · [ZERO_COST.md](./ZERO_COST.md) · [PERFECT.md](./PERFECT.md)

## 已完成

| 阶段 | 内容 |
|------|------|
| **Phase 0** | **Agent 自我进化 R1**：`AGENTS.md`、`agent-ship.sh`、`check-routes.mjs`、Cursor 规则 |
| **Phase 0 R2** | **审计自动化**：`audit.sh`、`check-data`、`check-api-parity`、`smoke --bundle`、`AUDIT_LOG.md` |
| **Phase 12** | **上帝视角**：`god-view` 页、`PROGRESS_GOD_VIEW.md`、`platform/overview` API、核心文案对齐 |
| **Phase 13** | **动画演示**：`demo-tour` 五幕自动轮播、`DEMO_ANIMATION.md`、全屏展示 |
| **Phase 14** | **演示抛光**：demo-tour 进度条/幕计数/末幕跳登录、god-view 动画入口+构建时间、撮合文案、`?tour=1` 深链 |
| **Phase 15** | **撮合叙事强化**：匹配度徽章、share-demo 链接页、登录新访客横幅、god-view 今日撮合 KPI+数字动画、`?god=1`/`?share=1` 深链 |
| **Phase 16** | **登录进化**：手机号主登录、微信可关联、卡哇伊背景、全站柔和主题、上帝视角密码门控、onboarding 统一品牌头 |
| **Phase 16b** | **AuthBrandHeader**、register/role-select 渐变 onboarding、god-view-gate 深色主题对齐 |
| **Phase 17** | **完成单自动累加待结算**、student-pending 主题、验收文档对齐手机号登录 |
| **Phase 18** | **同学拉新推荐有奖**：推荐码/链接、注册绑定、首单奖励、referral 页 |
| Phase 1–2 | 公网 demo、卡片化 UI、接单/外出审批 |
| Phase 2.5–4 | 时间轴、SOS、收入、签到、绑定码、家属订单详情 |
| Phase 3 | PB hooks parity、排班/绑定/无障碍 |
| Phase 5 | 富数据集（8/6/20+）、服务日志、ListCountBar、成熟度测试文档 |
| **Phase 6** | **学校合作筛选**、**机构派单演示页**、**资料编辑**、**服务包购买**、待接单 scroll-view、student2 账号 |
| **Phase 7** | **路由 parity**（pages.json 注册 + MINIAPP_ROUTING 文档） |
| **Phase 8** | **PERFECT 验收清单**、GAP/ROADMAP/NIGHT_LOG 更新 |
| **Phase 9** | **发现页 scroll-view**、**地图 marker 富化**、**profile/edit 统一 API** |
| **Phase 10** | **mock 微信登录/支付**、**服务包购买**、**admin-hub**、**student3 审核守卫**、**结算展示**、**X-Active-Role** |
| **Phase 11** | **nav-guard 全覆盖**、**家属/老人订单 scroll-view**、**multi1 多角色演示**、**注册 pending 流程**、**smoke-demo.sh** |

## Phase 12+（真实上线时再开）

- 微信支付 / 微信登录 **商户实装**
- 云服务器常驻 API、独立 Admin Web
- 商业地图 Key、短信

## 不上线项（避免费用）

见 [ZERO_COST.md](./ZERO_COST.md) — 演示栈保持 GitHub Pages + demo-mock + 可选本地 PocketBase。
