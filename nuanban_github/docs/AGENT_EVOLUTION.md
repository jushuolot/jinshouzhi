# Agent 自我进化日志

> 记录自动迭代中的失败模式与对策，供下一轮 agent **先读再干**。

## 进化轮次 · 2025-06

### 观察到的失败模式

| # | 现象 | 根因 | 对策 |
|---|------|------|------|
| E1 | Phase 9 代码改完但用户问「在工作吗？」 | 子 agent 未执行 commit/push | 任务末尾 **强制** `agent-ship.sh`；父 agent 在子任务完成后检查 `git status` |
| E2 | `family/bind.vue` 构建失败 | 分包相对 import 层级错误 | 改前 grep 同目录其他文件的 import；见 AGENTS.md |
| E3 | push 需 rebase | Actions 推了 `deploy(nuanban)` commit | 推送前 **始终** `git pull --rebase origin main` |
| E4 | 新页面 404 | 只写了 `.vue` 未改 `pages.json` | `check-routes.mjs` 校验；MINIAPP_ROUTING 同步 |
| E5 | 公网与本地行为不一致 | 只改了 demo-mock 或只改了 PB hooks | 接口变更 checklist：mock + hooks + 类型 |
| E6 | Phase 任务过大一次做不完 | 范围未拆、无验收点 | ROADMAP 按 Phase 写清；每 Phase 对应 PERFECT 条目 |

### 本轮产出（元能力）

1. **`AGENTS.md`** — 仓库级 agent 说明书
2. **`scripts/agent-ship.sh`** — 构建 + 路由检查 + 发货提醒
3. **`scripts/check-routes.mjs`** — pages.json 与 vue 文件粗校验
4. **`.cursor/rules/nuanban-autonomous.mdc`** — Cursor 持久规则

### 发货 Definition of Done（DoD）

- [ ] `npm run build:h5` 通过
- [ ] `./scripts/check-routes.mjs` 无 error
- [ ] demo-mock 与 PB hooks 行为一致（若动 API）
- [ ] `pages.json` + `MINIAPP_ROUTING.md` 已更新（若动路由）
- [ ] `ROADMAP` / `GAP_AUDIT` / `NIGHT_LOG` 已记一笔
- [ ] commit 已 push 到 `main`；用户可用公网 URL 验收

### 下一步进化（待 Phase 10+ 后）

- [ ] `agent-ship.sh` 增加 grep：新增 `.vue` 是否出现在 `pages.json`
- [ ] 可选：Playwright 冒烟（登录页可打开、hash 路由）
- [ ] 子 agent 模板：末尾固定「若 `git status` 有改动则必须 push」

## 给未来 agent 的一句话

**不要只写代码——写完要能在线上 demo 里点到。** 没 push = 没做。
