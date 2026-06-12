# 暖伴勤工 · 「Perfect」零成本演示验收清单

> 公网 demo 目标：**无需后端、无需支付、无需云服务器**，GitHub Pages + demo-mock 即可完整走通三端主流程。

## 1. 部署与访问

- [ ] Actions 部署成功（`main` push → Pages）
- [ ] 演示 URL 可打开：<https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login>
- [ ] 强刷后登录页显示卡哇伊背景 + 手机号登录表单

## 2. 登录与公共页

- [ ] **手机号登录**：13800000001–06 对应各演示角色；验证码 **`000000`**；登录页「测试账号」可点选填入
- [ ] 首次登录 → **选择身份** → 进入对应首页
- [ ] **微信快捷登录（可关联）** 为次要入口
- [ ] 13800000002 学生 · 城东师范学院；13800000003 → **审核中** 页
- [ ] 登录页显示 **「测试版」** 角标
- [ ] **更多 → 运营演示** → 平台 KPI / 机构派单 / 学校合作
- [ ] 用户协议页 `pages/common/agreement` 可打开

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

- 微信支付 / 微信登录 **商户实装**
- 云服务器常驻 API
- 独立 Admin Web（小程序内 `admin-hub` + `org-dispatch` 演示替代）

## 10. 自动化复查

```bash
./scripts/audit.sh      # 全量
./scripts/agent-ship.sh # 发货前
```

见 [AUDIT_LOG.md](./AUDIT_LOG.md)
