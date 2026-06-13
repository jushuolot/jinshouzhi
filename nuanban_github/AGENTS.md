# 暖伴勤工 · Agent 工作说明

> 供 Cursor / 夜间自动迭代 agent 阅读。**先读本文件，再改代码。**

## 仓库布局

| 路径 | 说明 |
|------|------|
| `nuanban_github/` | 本应用 monorepo（miniapp + pocketbase + docs） |
| Git 根目录 | 上级目录 `jinshouzhi`（`git` 在 monorepo 外一层） |
| 公网演示 | `https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login` |

## 固定约束

1. **三环境**：本地 **正式版**（PocketBase）→ GitHub **发布版**（真实 API，与阿里云同库）→ 阿里云 **发布稳定版**（PocketBase 生产）
2. **双端 API 对齐**：改接口时同时更新 `demo-mock.ts` 与 `packages/pocketbase/pb_hooks/nuanban.pb.js`
3. **新页面必注册**：`packages/miniapp/src/pages.json` + `docs/MINIAPP_ROUTING.md`
4. **最小 diff**：只改与当前 Phase 相关的文件，匹配现有风格
5. **完成闭环**：实现 → `npm run build:h5` → commit → `git pull --rebase` → `git push`（用户要求自动完善时）

## 标准迭代流程

```bash
# 1. 读路线图与缺口
docs/ROADMAP.md · docs/GAP_AUDIT.md · docs/PERFECT.md

# 2. 实现功能（miniapp + mock + hooks）

# 3. 发货前 / 全量复查
./scripts/agent-ship.sh   # 发货前五步
./scripts/audit.sh        # 全量审计（用户说「检查」「进化」时）

# 4. 提交（git 根目录）
cd ..  # 到 jinshouzhi 根
git add nuanban_github/...
git commit -m "feat(nuanban): ..."
git pull --rebase origin main && git push origin main
```

推送后 Actions 自动构建并写入 `docs/nuanban/`（约 2 分钟）。

## 常见踩坑

| 问题 | 处理 |
|------|------|
| 子包 import 路径错误 | `package-family/*` 用 `../api`；`package-student/*` 用 `../../api` |
| 老人 id 别名 | 使用 `normalizeElderId`（`elder-zhang` → `elder-1`） |
| 后台 agent 只改文件未 push | **必须**跑 `agent-ship.sh` 并 push，否则用户看不到 |
| push 被拒 | 先 `git pull --rebase origin main`（Actions 会推 deploy commit） |
| 微信登录/支付 | **演示 mock**，不接真实商户 |
| `X-Active-Role` | 客户端 `request.ts` 已带头；订单聊天/语音 **hooks 强校验**，API 测试须用此头（非 `X-Nuanban-Role`） |

## 自动化验收（本地正式版 · 2026-06-05）

```bash
./scripts/dev-test.sh          # PocketBase + seed
node scripts/test-product-smoke.mjs      # 29/29 老人·家属·运营·语音
node scripts/test-student-audit-flow.mjs # 20/20 注册/审核
```

详见 [LOCAL_TEST.md](./docs/LOCAL_TEST.md) 验收记录表。

## 演示账号

手机号登录（**本地 / GitHub 发布版 / 阿里云**：九宫格验证 → 运营 **更多 → 短信发件箱** 取 6 位码；**无** `000000`）。仅显式 Mock（`VITE_DEMO_MOCK=true`）或游客浏览可用 `000000`。见 `docs/SMS_CAPTCHA.md` 与 `demo-rich-data.ts`。

| 手机号 | 邮箱 | 角色 | 用途 |
|--------|------|------|------|
| `13800000001` | `student1@test.nuanban.dev` | 学生 | 示范大学、默认主流程、进行中订单（语音测） |
| `13800000002` | `student2@test.nuanban.dev` | 学生 | 城东师范学院、学校合作筛选 |
| `13800000003` | `student3@test.nuanban.dev` | 学生 | 审核中页、无法接单 |
| `13800000004` | `family1@test.nuanban.dev` | 家属 | 代付、外出、服务包、SOS |
| `13800000005` | `elder1@test.nuanban.dev` | 老人 | 找陪护、SOS（张奶奶） |
| `13800000006` | `multi1@test.nuanban.dev` | 三角色 | 身份切换演示 |

运营台：登录页 **连点左上角「暖」** → 口令 `nuanban2026`（或 `暖伴2026`）→ 六 Tab 运营台（含 **机构** 老人档案）。

**发布**：GitHub Pages = **发布版**（真实 API，`release-formal.sh`）；阿里云 = **发布稳定版**，`release-prod.sh`。见 [ENV_PARITY.md](./docs/ENV_PARITY.md) · [RELEASE.md](./docs/RELEASE.md)。

## 产品核心（勿偏离）

**附近中老年 ↔ 在校大学生 · 有偿陪护 · 平台撮合。** 三种路径：机构派单、老人找同学、同学找需求。运营看板：H5 `pages/common/admin-hub`。

## 文档索引

- [ENV_PARITY.md](./docs/ENV_PARITY.md) — 测试/正式一致性与硬约束
- [PROGRESS_GOD_VIEW.md](./docs/PROGRESS_GOD_VIEW.md) — 历史进度文档（看板已并入运营演示）
- [AGENT_EVOLUTION.md](./docs/AGENT_EVOLUTION.md) — 自我进化与教训
- [PERFECT.md](./docs/PERFECT.md) — 验收清单
- [TEST_MATURITY.md](./docs/TEST_MATURITY.md) — 成熟度矩阵
- [ZERO_COST.md](./docs/ZERO_COST.md) — 成本边界

## Phase 规划原则

- **不考虑预算/资质** 时：用 mock/演示页实现支付、Admin、审核等，不接入真实商户或云服
- **自我进化优先**：流程/脚本/规则不完善时，先补 `AGENTS.md`、校验脚本，再开新 Phase
