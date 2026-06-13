# OpenAPI 纲要（V1.1）

> 完整拆分 YAML 可在实现阶段按域拆文件；此处为最小闭环清单。

## 认证

- `Authorization: Bearer <token>`  
- 多租户：`tenant_id` 贯穿请求体或上下文。

## Command（写入）

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/lo` | 创建 LO → `LO_CREATED` |
| PATCH | `/api/lo/{lo_id}` | 变更 → `LO_CHANGED` |
| POST | `/api/lo/{lo_id}/events` | 上报事件（幂等键必填） |
| POST | `/api/evidence` | 注册证据 + 预签名上传 URL |
| POST | `/api/lo/{lo_id}/replan` | 重算 → `DECISION_REPLAN` |
| POST | `/api/lo/{lo_id}/pod/qc` | 回单质检决策 |
| POST | `/api/lo/{lo_id}/rating/run` | 计费 |
| POST | `/api/recon/submit` | 发起对账 |
| POST | `/api/recon/{recon_id}/resolve` | 差异处理 |
| POST | `/api/subscriptions` | Webhook 订阅 |

## Query（投影）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/lo` | LO Index |
| GET | `/api/lo/{lo_id}` | LO360 摘要 |
| GET | `/api/lo/{lo_id}/timeline` | 事件时间线 |

## 幂等

所有 Command 携带：`idempotency_key`、`source_system`、`schema_version`。
