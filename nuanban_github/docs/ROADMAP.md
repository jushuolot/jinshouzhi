# 暖伴勤工 · 迭代路线图

> 与 [GAP_AUDIT.md](./GAP_AUDIT.md) 对照更新。

## 已完成

| 阶段 | 内容 |
|------|------|
| Phase 1 | 公网 demo-mock、三角色登录、服务 SKU、GitHub Pages |
| Phase 2 | 同城有约式卡片、三端首页、接单 Tab、外出审批 |
| Phase 2.5 | 订单时间轴、服务中链路、SOS 演示、收入明细页 |

## Phase 3（当前）— 本地联调 parity + 薄弱页

1. **PocketBase hooks** — `start/complete/active/income/SOS`，富化 `pending` 订单字段  
2. **列表页** — 老人「我的服务」、家属「订单」分段展示  
3. **规划页首版** — `student/schedule/list`、`family/bind`、`elder/settings`（大字号）  
4. **schema** — `sos_alerts` 集合  

## Phase 4（下一步）

- `student/schedule/checkin` 独立签到页（地理围栏占位）  
- `family/order/list` 全状态筛选 + 订单详情  
- 真实微信支付 / 微信登录（上线项）  
- Admin Web 机构派单（若恢复 admin 包）  

## Phase 5（二期）

- 学校合作过滤、扫码绑定二维码流  
- `X-Active-Role` 服务端校验  
- 模板消息 / SOS 后台运营台  
