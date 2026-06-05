# 暖伴勤工 · 功能与界面对照审计

> 对照 [PRODUCT.md](./PRODUCT.md)、[MINIAPP_ROUTING.md](./MINIAPP_ROUTING.md) 与当前 `packages/miniapp` 实现。  
> 更新：2025-06 · V1 演示 polish 轮次

## 图例

| 符号 | 含义 |
|------|------|
| ✅ | 已实现且可用（含 demo-mock） |
| 🟡 | 部分实现 / 演示占位 / UI 待完善 |
| ❌ | 未实现（V1 不验收或二期） |

---

## 1. 后端 Hooks（V1 验收）

| 能力 | 状态 | 备注 |
|------|------|------|
| wx-login / dev-login / auth/me / register | ✅ | demo-mock 同步 |
| elder/caregivers/nearby | ✅ | mock 多陪护数据 |
| elder/orders 下单 | ✅ | |
| student/orders/pending + accept/reject | ✅ | mock 富化订单字段 |
| family/orders pay | ✅ | |
| family/outdoor approve | ✅ | |
| student orders active/start/complete/income | ✅ | Phase 3 hooks |
| elder/sos + family/student sos | ✅ | sos_alerts 集合 |
| student/schedules | ✅ | 排班列表 API |
| seed-demo | ✅ | 本地 PocketBase |

---

## 2. 客户端页面（pages.json 已注册）

### 2.1 公共主包

| 页面 | 状态 | 备注 |
|------|------|------|
| launch / login / role-select / register | ✅ | |

### 2.2 老人分包 package-elder

| 页面 | 状态 | 备注 |
|------|------|------|
| home | 🟡→✅ | 本次：统计卡片 + 快捷入口 |
| caregivers/list | 🟡→✅ | PersonCard 列表 |
| caregivers/detail | 🟡→✅ | 富资料 + 预约 CTA |
| order/create / list / detail | ✅ | |
| profile | ✅ | ProfilePage |

### 2.3 家属分包 package-family

| 页面 | 状态 | 备注 |
|------|------|------|
| home | 🟡→✅ | 绑定老人、待支付、外出审批入口 |
| order/list / pay | ✅ | |
| outdoor/approve | 🟡→✅ | 本次 UI 完善 |
| profile | ✅ | |

### 2.4 学生分包 package-student

| 页面 | 状态 | 备注 |
|------|------|------|
| home | 🟡→✅ | 仪表盘：统计、待接单 badge |
| discover/list | ✅ | 列表/地图；PersonCard 列表项 |
| discover/elder | 🟡→✅ | 去除 V1 演示 stub 感 |
| order/pending | 🟡→✅ | 富订单卡片 |
| order/request | ✅ | 时间轴 + 接单/签到/完成 |
| order/active | ✅ | 服务中列表 |
| income | ✅ | 收入明细页 |
| profile | ✅ | |

### 2.5 TabBar（RoleTabBar）

| 角色 | 状态 | 备注 |
|------|------|------|
| elder 首页/服务/我的 | ✅ | |
| family 首页/订单/我的 | ✅ | |
| student 首页/接单/发现/我的 | 🟡→✅ | 新增「接单」Tab |

---

## 3. 产品能力 vs 实现

| 能力 | 产品目标 | V1 实现 | 状态 |
|------|----------|---------|------|
| 老人找陪护（附近学生） | Haversine 5km | API + 列表/详情 | ✅ |
| 老人下单 | POST elder/orders | create 页 | ✅ |
| 学生待接单池 | pending_accept 全局 | pending + request | ✅ |
| 学生附近老人 | listNearbyElders | discover 分包 | ✅ |
| 家属代付 | pay stub | pay 页 | ✅ |
| 外出审批 | outdoor approve | approve 页 + mock 订单 | ✅ |
| 机构派单 | Admin 写库 | 无客户端 | ❌ 预期 |
| 签到 → in_service → completed | 演示链路 | request 页 + mock start/complete | 🟡→✅ demo |
| 服务日志 / 排班列表 | 二期 | 规划页未注册 | ❌ |
| 学生收入 / 结算展示 | 二期 | income 页 + mock | 🟡→✅ demo |
| 家属绑定老人 UI | 二期 | 绑定码/链接 + 列表 | ✅ demo |
| 到场签到 / 围栏 | 二期 | schedule/checkin | ✅ demo |
| 家属订单详情 | — | family/order/detail | ✅ |
| 学校合作过滤 | 二期 | — | ❌ |
| 老人 SOS 落库 | 产品目标 | PB + mock + 待办 | ✅ |
| 微信支付实装 | 上线后 | stub | ❌ |
| X-Active-Role 服务端校验 | 二期 | 客户端 only | ❌ |

---

## 4. demo-mock（GitHub Pages）

| 项 | 状态 | 备注 |
|------|------|------|
| 三角色登录 | ✅ | |
| 多陪护学生 | 🟡→✅ | 4 名 mock |
| 富待接单（老人名/服务名） | 🟡→✅ | |
| 外出待审批订单 | 🟡→✅ | family 首页入口 |
| outdoor_approvals 集合 | 🟡→✅ | pbList mock |
| student/elder/family stats | ✅ | |

---

## 5. 规划页（未注册，勿验收）

见 [MINIAPP_ROUTING.md](./MINIAPP_ROUTING.md) §6：agreement、elder/settings、family/bind、student/schedule/*、income 等 — **全部 ❌ 预期未做**。

---

## 6. 本次 polish 范围与仍延期项

### 已完成（本轮）

- `PersonCard.vue` 复用组件
- 三端首页仪表盘化（统计 + 快捷操作）
- 学生 discover/elder 富资料
- 待接单富卡片 + 「接单」Tab
- demo-mock 数据扩展

### 仍延期（不阻塞 V1 演示）

- 真实微信登录 / 支付
- 微信原生扫码（当前为绑定码/免费 QR 图 + 链接）
- 服务日志页 schedule/log
- Admin 机构派单 / 运营后台

---

## 7. 建议验收路径（公网 demo）

1. 打开 GitHub Pages → 开发登录 `student1@test.nuanban.dev`  
2. 接单 Tab → 接受 → 服务中 → 开始服务 → 完成服务（时间轴）  
3. 首页 → 收入明细；老人 SOS 后见紧急求助横幅  
4. `family1@test.nuanban.dev` → 外出审批 / SOS 确认 / 模拟支付  
5. `elder1@test.nuanban.dev` → 找陪护 → 预约 → 一键求助  
