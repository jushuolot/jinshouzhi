# 雨林生态圈 · C4I + 城市经营 设计总纲

> v13 方向：每个角色 **手机现场作业** + **PC 指挥态势**；每个实体 **独立生命周期**，又在链上 **同生共死**（履约 + 应收应付）。

## 1. 隐喻 → 工程映射

| 雨林隐喻 | 系统实体 | 技术对象 |
|----------|----------|----------|
| 种子 | 意向/草稿订单 | `ChainOrder.status=draft`、种子进化 G*n |
| 发芽 | 单据草拟 | `Document` draft、SO/PR/PO |
| 生长 | 履约推进 | LO 阶段事件、域 `stages` |
| 开花 | 交付/签收 | POD、ATP 达成 |
| 结果 | 结算 | `PeerSettlement` AR/AP |
| 枯落/腐殖 | 关闭/归档 | `settled`、证据链封存 |
| 动物 | 操作角色 | `actor` 镜头：货主/仓管/司机… |
| 食物网 | 上下游 + 资金网 | `LEG_HANDOFF` + `PeerSettlement` 双边绑定 |

**有点有面**：点 = 单个 LO/企业/单据的生命周期；面 = 链订单投影、控制塔 KPI、生态网络图。

## 2. 双壳 UI（告别「四不像」）

```
┌─────────────────────────────────────────────────────────┐
│  C4I 指挥层 (PC)          world/c4i/ 或 world/index 战略模式 │
│  · 全球/区域 zoom（城市经营：图层开关）                      │
│  · 控制塔：OTIF / 异常雷达 / 碳 / ATP                      │
│  · 链订单「战役」视图：多段并行，不抢现场按钮                  │
└─────────────────────────────────────────────────────────┘
                          │ 同一 kernel / IndexedDB
┌─────────────────────────────────────────────────────────┐
│  Field 现场层 (Mobile)     world/field/?role=driver      │
│  · 单角色、单待办、大按钮（司机端范式）                       │
│  · 扫码/拍照/签收 = 原语动作                               │
│  · 无地图、无多面板 — 只有「我的任务队列」                    │
└─────────────────────────────────────────────────────────┘
```

参考：

- **C4I**：态势共享、角色分流、异常优先、指挥不代操。
- **城市经营游戏**：空间 zoom、图层（仓/线/关务）、时间轴、实体状态色块。

当前 `world/index.html` 把指挥 + 制单 + 履约 + 地图塞一栏 → v13 拆壳。

## 3. 生命周期状态机（`lot-organism.js`）

每个 **有机体** `Organism` 绑定一个内核 id（LO / Document / Settlement / Enterprise）：

```
SEED → SPROUT → GROWING → MATURE → FRUITING → DECAY → COMPOST
         ↑                      ↓
      EXCEPTION ─── RESOLVED ────┘
```

- **独立周期**：仓内 LO 可 `GROWING` 而干线 LO 仍 `SEED`（闸门未开）。
- **同生共死**：`symbionts[]` 记录共生 id；一方 `EXCEPTION` 可投影为另一方阻塞原因；结算 `FRUITING` 绑定 POD `MATURE`。

## 4. 应收应付 = 生态共生（不是外挂财务）

每笔 `PeerSettlement` 必须：

1. `triggerCode` 绑定履约事件（如 `INVOICE_MATCHED`）
2. `payer` / `payee` 即链上相邻企业
3. 状态机：`pending_recon → confirmed → invoiced → paid` 与 LO 阶段 **同一待办队列** 出现

**同生死**：付款未完成 → 上游供应商 LO 标记 `DECAY` 风险；签收未完成 → 销售侧结算不可 `FRUITING`。

## 5. 角色 × 终端矩阵

| 角色 | Field 手机 | C4I PC |
|------|------------|--------|
| 货主 shipper | 下单、审单、确认 | 销售漏斗、客户 ATP |
| 计划员 planner | MRP、PR 下达 | 产能与缺料热力 |
| 仓管 warehouse | 扫码拣配装车 | 库容、波次、设备 |
| 司机 driver | 揽收在途签收 | 在途车队轨迹 |
| 调度 dispatcher | 派车改线 | 路网异常雷达 |
| 财务 finance | 对账确认付款 | 结算瀑布图 |
| 关务 customs_broker | 报关单证 | 跨境里程碑 |

统一 API：`getPendingOperation(chainId, actor)` + `executeOperation`（已实现 v12.1）。

## 6. 演进路线

| 版本 | 交付 |
|------|------|
| v12.1 | 人工作业台、单据闸门 ✅ |
| v13.0 | Field 统一壳 + C4I 模式切换 + Organism 投影 |
| v13.1 | 企业生命曲线、共生告警 |
| v14 | 多链「生态网」图（食物网可视化） |

## 7. 目录约定（v13+）

```
docs/world/
  c4i/          # PC 指挥（从 index 抽离态势层）
  field/        # 移动现场（role 参数）
  shared/       # operation-console、role-shell.js
kernel/
  lot-organism.js
```

底层不变：**事件账本 + 投影**；变的只是 **谁在哪块屏上看到什么、能点什么**。
