# 架构与数据流

## 写入链路（强一致意图）

```
Client → Command API → Event Ledger (append-only) → Async Projection Workers → Read Models
```

## 核心表/域（逻辑）

| 域 | 职责 |
|----|------|
| `lo_contract_snapshot` | LO 当前契约快照（便捷查询；事实仍以事件为准） |
| `ledger.event` | 事件：FACT / DECISION / EXCEPTION / FINANCE |
| `evidence_item` | 证据元数据 + 对象存储 URI + sha256 |
| `policy.*` | 策略定义、版本、命中策略包 |
| `projection.*` | lo_index、task_graph、evidence_pod、rating_breakdown、reconciliation |

## 引擎（概念）

- **Policy**：SLA、分配、回单、计费、判责边界  
- **Orchestration**：生成 TaskGraph（替代 OTWB 分段对象）  
- **Replanning**：延误/插单/限行时重算方案  
- **Evidence/POD**：OCR、质检 DSL、分发  
- **Finance**：计费行绑定触发事件 + 证据 + 条款；对账差异解释链  

## AI 嵌入点

- 意图理解与字段补全  
- 异常处置建议（可解释）  
- 回单 OCR 与一致性校验  
- 对账差异归因材料生成  
