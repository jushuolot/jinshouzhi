# 暖伴勤工 · 「Perfect」零成本演示验收清单

> 公网 demo 目标：**无需后端、无需支付、无需云服务器**，GitHub Pages + demo-mock 即可完整走通三端主流程。

## 1. 部署与访问

- [ ] Actions 部署成功（`main` push → Pages）
- [ ] 演示 URL 可打开：<https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login>
- [ ] 强刷后登录页提示「富数据集 · 零成本 Mock」

## 2. 登录与公共页

- [ ] 开发登录：student1 / student2 / family1 / elder1
- [ ] student2 登录后昵称为「周同学」、学校「城东师范学院」
- [ ] 用户协议页 `pages/common/agreement` 可打开
- [ ] 机构派单演示页 `pages/common/org-dispatch` 可派单

## 3. 学生端

- [ ] 待接单列表 **10 单**，可滚动（scroll-view）
- [ ] 发现页「学校合作」开关过滤合作机构老人
- [ ] 我的 → **编辑资料** → 改学校后发现页筛选变化
- [ ] 接单 → 服务中 → 签到/完成 → 收入明细
- [ ] 服务日志 8+ 条

## 4. 家属端

- [ ] 首页待支付 / 外出审批入口
- [ ] **服务包购买** 演示页（不产生真实扣款）
- [ ] 订单列表 20+ 条

## 5. 老人端

- [ ] 找陪护 → 预约 → 一键 SOS
- [ ] 绑定码 / 无障碍设置

## 6. 数据与 API 对齐

- [ ] `demo-rich-data.ts`：ORG_SCHOOL_PARTNERS、DEMO_SCHOOLS、10 pending_accept
- [ ] demo-mock：PATCH/GET profile、org dispatch 与 PocketBase hooks 行为一致
- [ ] 本地 PocketBase：`./scripts/seed-demo.sh` 后 hooks 可用

## 7. 文档

- [ ] [MINIAPP_ROUTING.md](./MINIAPP_ROUTING.md) 与 `pages.json` 一致
- [ ] [GAP_AUDIT.md](./GAP_AUDIT.md) 学校合作 / 机构派单 / 资料编辑 已 ✅
- [ ] [ROADMAP.md](./ROADMAP.md) Phase 6–10+ 已更新

## 8. 明确不做（零成本边界）

- 微信支付 / 微信登录商户
- 云服务器常驻 API
- Admin 运营后台（派单用登录页「机构派单」演示页替代）
