# 暖伴勤工 · 支付演进计划

家属/老人为服务订单付款，学生侧为结算与提现。本文按 **测试版 → 正式版储值卡 → 微信支付** 三阶段说明实现边界与 API 对齐。

---

## 现状对照

| 能力 | 测试版（`VITE_DEMO_MOCK`） | 正式版（PocketBase） |
|------|---------------------------|----------------------|
| 储值卡余额 | `demo-wallet.ts` + `localStorage` | `nuanban_lib.js` 内存演示钱包 |
| 订单/SOS 状态 | `demo-mock-state.ts` v3 + `localStorage` | `orders` / `sos_alerts` 集合 |
| 家属代付页 | `package-family/order/pay.vue` | 同路由，连真实 API |
| 学生提现 | `demo-student-wallet.ts` | 结算记录 + 提现记录（hooks） |

正式版 hooks 入口：`packages/pocketbase/pb_hooks/nuanban.pb.js` · 钱包逻辑：`nuanban_lib.js`。

---

## Phase 1 · 测试版（当前）

**目标**：零成本演示完整支付 UX，不产生真实扣款。

### 储值卡（Mock）

- **模块**：`packages/miniapp/src/utils/demo-wallet.ts`
- **持久化**：`localStorage` 键 `nuanban_wallet_v1`
- **种子余额**：家属 `¥500.00`、老人 `¥300.00`；多角色账号 `13800000006` 映射到对应种子钱包
- **API 模拟**（`demo-mock.ts`）：
  - `GET /nuanban/family/wallet` · `GET /nuanban/elder/wallet`
  - `POST /nuanban/family/wallet/topup` · `POST /nuanban/elder/wallet/topup`
  - `POST /nuanban/family/wallet/pay-order` · `POST /nuanban/elder/wallet/pay-order`
- **行为**：充值 ≥ ¥1、单次 ≤ ¥5000；支付时校验余额并写交易流水；订单 `payment_status` → `paid`，`pending_payment` → `pending_accept`

### 微信支付（UX Stub）

- **页面**：`package-family/order/pay.vue`
- **流程**：选择「微信支付（演示）」→ 1.5s 模拟 loading → 调用 `POST /nuanban/family/orders/{id}/pay`（不扣储值卡，直接标记已付）
- **说明文案**：弹窗注明「演示，不产生真实扣款」
- **动画演示**：`demo-tour.vue` 含微信支付视觉占位

### 订单完成时补扣

- 家属/老人 `confirm-complete` 若 `payMethod=wallet` 且仍 `unpaid`，走 `walletPayOrderForUser` 再归档
- 完成后写入 `serviceLogs`、累加当月 `settlements`（`addToPendingSettlement`）

### 验收

1. 登录 `13800000004` → 待支付 → 储值卡支付 / 微信支付（演示）
2. 余额不足时提示充值；充值后刷新余额仍保留
3. 接单→完成→确认后，刷新页面订单与 SOS 状态仍正确（`demo-mock-state`）

---

## Phase 2 · 正式版储值卡（PocketBase）

**目标**：阿里云部署下，家属/老人使用平台储值卡完成真实账务记录（仍可不接微信商户）。

### 数据模型（建议）

| 集合 | 字段要点 |
|------|----------|
| `wallet_accounts` | `user`（家属/老人）、`balance_cents` |
| `wallet_transactions` | `user`、`type`（topup/pay）、`amount_cents`、`order`、`label`、`created` |

当前演示实现为 **hooks 内存 Map**（`walletDemoStoreMap`），上线前应迁移为持久化集合 + 迁移脚本。

### 已有 API（`nuanban.pb.js`）

与测试版路径一致，由 `nuanban_lib.js` 实现：

```
GET  /api/nuanban/family/wallet
POST /api/nuanban/family/wallet/topup        body: { amountCents }
POST /api/nuanban/family/wallet/pay-order    body: { orderId }

GET  /api/nuanban/elder/wallet
POST /api/nuanban/elder/wallet/topup
POST /api/nuanban/elder/wallet/pay-order
```

`walletPayOrderRecord` 规则：

- 可支付状态：`pending_payment`，或 `pending_confirm` 且 `payment_status=unpaid`
- 扣款成功 → `payment_status=paid`、`paid_at`；若原状态为 `pending_payment` → `pending_accept`
- 外出服务：`POST /api/nuanban/family/orders/{id}/pay` 在标记已付后，若服务项 `requires_outdoor_approval` → 订单转为 `outdoor_pending`

### 家属「模拟微信支付」正式版行为

`POST /api/nuanban/family/orders/{id}/pay`：仅当 `status=pending_payment` 时，直接 `payment_status=paid`（运营/家属手动确认已线下收款），**不经过储值卡扣款**。与测试版 stub 语义一致。

### 学生结算

- `GET /api/nuanban/student/settlements` — 月度结算列表
- `GET/POST /api/nuanban/student/withdrawal` — 可提现余额与提现申请
- 测试版对应：`demo-student-wallet.ts`（提现记录独立 `localStorage`）

### Phase 2 交付清单

- [ ] `wallet_accounts` / `wallet_transactions` 集合与 seed
- [ ] `nuanban_lib.js` 从内存 Map 改为读写集合
- [ ] 充值来源：运营后台入账或线下转账登记（仍不接微信）
- [ ] 双端对齐：`demo-mock.ts` 行为与 hooks 回归用例（`pb-smoke-*.sh`）

---

## Phase 3 · 微信支付 JSAPI（ outline ）

**目标**：微信小程序/H5 内调起微信支付，支付结果回调更新订单。

### 前置条件

- 微信商户号、小程序 AppID 绑定
- 服务端签名与回调 URL（HTTPS，正式域名 `nuanban.cc`）
- **不在** GitHub Pages 测试版启用（无商户密钥、无服务端）

### 建议接口

```
POST /api/nuanban/pay/wechat/create
  body: { orderId, scene: 'jsapi' | 'h5' }
  → { prepayId, package, signType, paySign, nonceStr, timeStamp }

POST /api/nuanban/pay/wechat/notify   # 微信服务器回调，验签后更新订单

GET  /api/nuanban/pay/wechat/status?orderId=...
```

### 前端（uni-app）

1. `pay.vue`：`payMethod === 'wechat'` 时调用 `create`，非 mock 环境使用 `uni.requestPayment`（或微信 JSSDK `chooseWXPay`）
2. 轮询或 WebSocket 等待 `notify` 落库后跳转成功页
3. 失败/取消：保持 `pending_payment`，允许改选储值卡

### 与储值卡关系

- 微信支付成功 ≡ `payment_status=paid`，不走 `walletDeductForOrder`
- 退款、部分退款：独立 `refunds` 集合 + 微信退款 API（Phase 3b）

### 安全

- 金额以服务端订单 `amount_cents` 为准，客户端不可改价
- `notify` 幂等（`transaction_id` 唯一）
- 测试版继续仅展示 stub，编译开关 `VITE_RELEASE_CHANNEL=test` 禁用真实 `requestPayment`

---

## 相关文档

- [TEST_VERSION.md](./TEST_VERSION.md) — 测试版验收与 Mock 数据量
- [RELEASE.md](./RELEASE.md) — 测试版 / 正式版发布
- [ZERO_COST.md](./ZERO_COST.md) — 零成本演示边界
