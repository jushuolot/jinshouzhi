# Agent 自我进化日志

> 记录自动迭代中的失败模式与对策，供下一轮 agent **先读再干**。

## 进化轮次 · 2025-06（R1）

### 失败模式 E1–E6

| # | 现象 | 对策 |
|---|------|------|
| E1 | 子 agent 未 push | 末尾强制 `agent-ship.sh`；父 agent 查 `git status` |
| E2 | 分包 import 路径错误 | grep 同目录 import |
| E3 | push 需 rebase | 始终 `git pull --rebase` |
| E4 | 新页面 404 | `check-routes.mjs` |
| E5 | mock/hooks 不一致 | `check-api-parity.mjs` |
| E6 | Phase 过大 | ROADMAP + PERFECT 分 Phase |

### R1 产出

`AGENTS.md` · `agent-ship.sh` · `check-routes.mjs` · Cursor 规则

---

## 进化轮次 · 2025-06（R2）· 全量审计后

### 新失败模式

| # | 现象 | 对策 |
|---|------|------|
| E7 | 子 agent 流中断 `WritableIterable is closed` | 以 `git log` / 代码为准，不依赖子 agent 状态；父 agent 收尾 push |
| E8 | 冒烟仅 HTTP 200，Pages 内容陈旧 | `smoke-demo.sh --bundle` 检查 login chunk 含 `multi1` 等标记 |
| E9 | 文档与代码漂移 | 进化轮同步 PERFECT / MINIAPP_ROUTING；`AUDIT_LOG.md` 归档 |
| E10 | 人工「重头检查」不可复现 | **`audit.sh`** 一键：路由 + 数据 + API + 构建 + 冒烟 |

### R2 产出

| 脚本 | 作用 |
|------|------|
| `audit.sh` | 全量复查（对应用户「重头再检查一遍」） |
| `check-data.mjs` | 10 待接单 / 8 老人 / 服务包 / 结算等 |
| `check-api-parity.mjs` | `api/*.ts` ↔ mock ↔ hooks |
| `smoke-demo.sh --bundle` | 部署产物是否含最新演示标记 |
| `AUDIT_LOG.md` | 审计结论归档 |

`agent-ship.sh` 已升级为 5 步（含 data + parity + bundle 冒烟）。

### 发货 DoD（更新）

- [ ] `./scripts/audit.sh` 或至少 `agent-ship.sh` 全绿
- [ ] `NIGHT_LOG` + `AUDIT_LOG`（若全量审计）各一行
- [ ] push 后等 Actions deploy，再跑 `smoke-demo.sh --bundle`

### 待 R3

- [ ] Playwright：hash 路由打开登录页并截图
- [ ] `nav-guard` 分包全覆盖或文档标明豁免列表
- [ ] 子 agent 任务模板写入 `AGENTS.md` 附录

## 给未来 agent 的一句话

**进化 = 让下一轮更少踩坑。** 先 `audit.sh`，再写功能；没 push 且 bundle 冒烟不过 = 没做完。
