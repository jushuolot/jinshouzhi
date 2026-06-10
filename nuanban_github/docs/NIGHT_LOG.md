# 夜间自动更新日志

> 您休息期间已推送 GitHub，Actions 会自动更新公网演示。

## 本轮（Phase 19 · 家属/老人确认服务并付款）

1. 学生「完成服务」→ 订单 `pending_confirm`，不再直接完结
2. 家属 / 老人订单详情：**确认服务并付款**（未付）或 **确认服务完成**（已预付）
3. API：`POST .../family|elder/orders/{id}/confirm-complete` · 时间轴新增「待确认」
4. 收入 / 结算仅在确认后计入（mock + pb hooks 对齐）

验收：`13800000001` 完成 `order-in-service-1` → `13800000004` 家属中心待确认 → 确认付款 → 学生收入变化

## 上一轮（Phase 18 · 同学拉新推荐有奖）

1. **推荐有奖** 页：`package-student/referral/index` · 推荐码 / 邀请链接 / 记录
2. 奖励规则（演示）：注册 ¥5 待到账 + 首单完成再 ¥10
3. 深链 `launch?ref=NBxxxx` → 登录 → 注册学生自动绑定推荐码
4. 学生首页横幅 + 我的 → **推荐有奖**
5. API：`GET /nuanban/student/referral` · register 支持 `referralCode`

验收：`13800000001` 登录 → 我的 → 推荐有奖 → 复制链接

## 上一轮（Phase 17 · 有偿闭环强化）

1. **完成订单** → 自动累加当月「待结算」金额（mock 动态 settlements）
2. 完成服务提示「已计入收入与待结算」
3. **student-pending** 页统一柔和主题
4. **DEMO_LINK / PERFECT** 对齐手机号登录与演示号表

公网：`13800000001` 登录 → 接单 → 完成 → **我的 → 收入** 看结算变化

## 上一轮（Phase 16 · 登录与视觉进化）

1. **手机号登录**为主 · 微信可关联 · 演示号 13800000001–06
2. **卡哇伊登录背景** + 手机预览修复（import 打包路径）
3. **全站柔和主题** `theme.css` + 三端首页暖色
4. **上帝视角密码门控** — 入口改「超级管理」· 默认密码 `nuanban2025` · 8h 会话
5. **AuthBrandHeader** — 注册/选身份/管理门控统一品牌头
6. 注册与身份选择页：奶油渐变 + 角色 emoji 卡片

公网登录：https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login  
超级管理：`#/pages/common/god-view-gate`

## 上一轮（Phase 15 · 撮合叙事强化）

1. **MatchScoreBadge** — 老人看同学 / 学生看老人详情页显示「匹配度 %」
2. **share-demo** — 一键复制动画/上帝视角/登录/深链
3. 登录页 **新访客横幅** → 动画演示；新增「分享链接」入口
4. **god-view** — 今日撮合成功 KPI、撮合成功率、数字滚动动画
5. **platform/overview** 扩展 `todayMatches` / `matchSuccessRatePct`（mock + PB）
6. **launch** 深链 `?god=1` / `?share=1`

公网：
- 分享页：`#/pages/common/share-demo`
- 深链上帝视角：`#/pages/common/launch?god=1`

## 上一轮（Phase 14 · 演示抛光 · 明早验收）

1. **demo-tour** 进度条 + 幕计数 1/5 + 更顺滑切幕动画
2. 第五幕结束自动跳转登录，提示用 **student1** 体验接单
3. **god-view** 顶部动画演示横幅 + **最后更新**（构建时间）
4. 学生首页副标题「附近老人有偿陪护 · 平台撮合匹配」
5. 老人首页「附近女大学生」文案对齐核心
6. **launch** 支持 `?tour=1` 直达动画演示
7. **smoke-demo.sh --bundle** 强制校验 `demo-tour` token

公网直达：
- 动画演示：`#/pages/common/demo-tour`
- 上帝视角：`#/pages/common/god-view`
- 深链动画：`#/pages/common/launch?tour=1`

## 上一轮（Phase 13 · 动画演示 · 明日验收）

1. **demo-tour** 五幕 CSS 动画：撮合总览 → 老人找同学 → 学生接单 → 家属代付 → 收入闭环
2. 自动播放 4.5s/幕 · 暂停/切幕 · 桌面全屏
3. 登录页 / 上帝视角入口 · [DEMO_ANIMATION.md](./DEMO_ANIMATION.md)
4. 公网：`#/pages/common/demo-tour`

## 上一轮（进化 R2 · 审计自动化）

1. **audit.sh** — 一键全量复查
2. **check-data.mjs** / **check-api-parity.mjs**
3. **smoke-demo.sh --bundle** — 验证 Pages 含 multi1 等标记
4. **agent-ship.sh** 升级为 5 步；**AUDIT_LOG.md** 归档

## 上一轮（Phase 11 · maturity polish）

1. **nav-guard** 学生 discover/pending/active/profile + 家属 order/list/pay；role-select 拦截 pending 学生
2. **scroll-view** 家属/老人订单列表 + ListCountBar
3. **multi1@test.nuanban.dev** 三角色演示 + profile「切换身份」
4. **register** 学生 → pending toast + student-pending；demo-mock register 端点
5. **smoke-demo.sh** + agent-ship 第 4 步（非阻塞 WARN）

## 上一轮（Phase 0 + Phase 10）

**自我进化**
1. `AGENTS.md` · `AGENT_EVOLUTION.md` · `agent-ship.sh` · `check-routes.mjs` · Cursor 规则

**Phase 10 mock（不考虑预算/资质）**
1. 微信登录演示流程（快速登录 / 选身份）
2. 家属支付页 mock 微信支付动画 + 成功态
3. 服务包购买 → 待支付订单
4. `admin-hub` / `school-coop` / `student-pending` + student3 审核账号
5. 收入页结算记录 · X-Active-Role demo 校验

## 上一轮（Phase 9 · discover / profile polish）

1. **discover/list** 列表 scroll-view（与 pending 一致，长列表可滚动）
2. **地图模式** marker 富化：老人姓名 label/callout、合作/非合作配色与图例
3. **profile/edit** 改用 `updateStudentProfile()` 统一 API 层
4. **ListCountBar** hint 统一为「· 可滚动」风格

## 上一轮（Phase 6–8 · Perfect 零成本 demo）

1. **pages.json** 注册 agreement、org-dispatch、profile/edit、package/buy
2. **login** student2 账号 + 协议/机构派单链接
3. **学校合作** discover/list + `school-coop.ts` + ORG_SCHOOL_PARTNERS
4. **资料编辑** profile/edit + PATCH profile（mock + PB hooks）
5. **机构派单** org-dispatch 页 + GET dispatchable / POST dispatch
6. **家属服务包** package/buy 演示页 + home 入口
7. **待接单** pending.vue scroll-view（10 单压测）
8. **student.ts** `updateStudentProfile()` 辅助
9. **文档** PERFECT.md、ROADMAP Phase 6–10+、GAP_AUDIT、MINIAPP_ROUTING

## 公网链接

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

建议先 **Cmd+Shift+R** 强刷。

## 快速验收（5 分钟）

1. 学生 → **接单**（10 单 + scroll-view）
2. 学生 → **发现** → 学校合作开关
3. 学生 → **我的 → 编辑资料** → 改学校后再看发现
4. 登录页 → **机构派单** → 派给林同学
5. student2 登录 → 城东师范学院合作筛选
6. 家属 → **服务包购买** + 外出审批

## 零成本栈未变

见 [ZERO_COST.md](./ZERO_COST.md) — 仍无微信支付/云服务器。

## 验收清单

见 [PERFECT.md](./PERFECT.md)
