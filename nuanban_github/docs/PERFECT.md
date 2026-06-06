# 暖伴勤工 · 「Perfect」零成本演示验收清单

> 公网 demo 目标：**无需后端、无需支付、无需云服务器**，GitHub Pages + demo-mock 即可完整走通三端主流程。

## 1. 部署与访问

- [ ] Actions 部署成功（`main` push → Pages）
- [ ] 演示 URL 可打开：<https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login>
- [ ] 强刷后登录页提示「富数据集 · 零成本 Mock」

## 2. 登录与公共页

- [ ] 开发登录：student1 / student2 / **student3(审核中)** / family1 / elder1
- [ ] **微信登录（演示）**：快速登录或选择身份
- [ ] student2 登录后昵称为「周同学」、学校「城东师范学院」
- [ ] student3 登录后进入 **审核中** 页，无法进入学生首页
- [ ] 用户协议页 `pages/common/agreement` 可打开
- [ ] **运营演示** `admin-hub` → 机构派单 / 学校合作只读表

## 3. 学生端

- [ ] 待接单列表 **10 单**，可滚动（scroll-view）
- [ ] 发现页「学校合作」开关过滤合作机构老人；列表可滚动（scroll-view）
- [ ] 我的 → **编辑资料** → 改学校后发现页筛选变化
- [ ] 接单 → 服务中 → 签到/完成 → 收入明细（含结算记录）
- [ ] **结算记录** 3 条（含 pending）
- [ ] 服务日志 8+ 条

## 4. 家属端

- [ ] 首页待支付 / 外出审批入口
- [ ] **服务包购买** → 创建待支付订单 → **支付页** 微信演示 UX
- [ ] 订单列表 20+ 条

## 5. 老人端

- [ ] 找陪护 → 预约 → 一键 SOS
- [ ] 绑定码 / 无障碍设置

## 6. 数据与 API 对齐

- [ ] `demo-rich-data.ts`：ORG_SCHOOL_PARTNERS、DEMO_SCHOOLS、10 pending_accept
- [ ] demo-mock：PATCH/GET profile、org dispatch、**packages/purchase**、**settlements** 与 PB 一致
- [ ] **X-Active-Role** 请求头在 demo-mock 与 PB 关键路由校验
- [ ] 本地 PocketBase：`./scripts/seed-demo.sh` 后 hooks 可用

## 7. 文档

- [ ] [MINIAPP_ROUTING.md](./MINIAPP_ROUTING.md) 与 `pages.json` 一致
- [ ] [GAP_AUDIT.md](./GAP_AUDIT.md) 学校合作 / 机构派单 / 资料编辑 已 ✅
- [ ] [ROADMAP.md](./ROADMAP.md) Phase 6–10 已更新

## 9. Phase 10 演示专项

- [ ] 微信登录演示流程（非 toast 阻断）
- [ ] 支付页：确认 → 微信支付 loading 1.5s → 成功态
- [ ] admin-hub 待派单统计 + school-coop 只读表
- [ ] student3 pending 审核守卫

## 8. 明确不做（零成本边界）

- 微信支付 / 微信登录商户
- 云服务器常驻 API
- Admin 运营后台（派单用登录页「机构派单」演示页替代）
