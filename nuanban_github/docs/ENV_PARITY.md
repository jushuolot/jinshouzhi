# 暖伴勤工 · 环境一致性与硬约束

> **原则**：测试系统与正式系统（阿里云）业务逻辑一致；GitHub Pages 作为测试备份，配置与本地测试机相同。仅因平台硬约束无法实现的差异，才允许跳过。

---

## 术语（勿混淆）

| 词 | 含义 | 用在哪 |
|----|------|--------|
| **Mock** | 浏览器内 `demo-mock.ts`，无 PocketBase | **仅 GitHub Pages**（硬约束） |
| **测试数据** | PocketBase 库内真实记录（`seed-demo`、万人 `seed-load-test`） | **本地 + 阿里云** |
| **parity** | 本地与阿里云同逻辑：`VITE_DEMO_MOCK=false` + Docker PB | 日常开发默认 |

本地 **不要** 开 `VITE_DEMO_MOCK=true`；`dev-test.sh` / `start-h5.sh` 会自动修正为 `false`。

---

## 三环境对照

| 维度 | 本地测试机 | GitHub Pages（测试备份） | 阿里云（正式发布） |
|------|------------|--------------------------|-------------------|
| **角色** | 开发 / 验收 | 零安装演示备份 | 对外生产 |
| **H5 构建** | `./scripts/start-h5.sh` | Actions 自动 build | `deploy-public.sh` / `release-prod.sh` |
| `VITE_RELEASE_CHANNEL` | `development` | `test` | `public` |
| `VITE_DEMO_MOCK` | **`false`（默认强制）** | **`true`（必须）** | **不设 / false** |
| 登录用户 API | PocketBase 测试数据 | 浏览器 Mock | PocketBase 生产数据 |
| 游客浏览 | Mock（未登录） | Mock | 无 Mock（需登录） |
| 角标 | 开发版 | 测试版 | 发布版 |
| 后端 | Docker PocketBase :8090 | **无**（静态托管） | Docker PB + Caddy |
| 数据持久化 | `pb_data/` 卷（测试数据） | localStorage | `pb_data/` 卷 |
| API 地址 | `/api` → 代理 8090 | 不发起真实 API（Mock 拦截） | `https://域名/api` |

**推荐流程**：`./scripts/dev-test.sh` → `./scripts/start-h5.sh` 本地 parity 测通 → push main 更新 GitHub 备份 → `./scripts/release-prod.sh` 部署阿里云。

---

## 业务逻辑对齐矩阵

以下规则在 **demo-mock.ts** 与 **pb_hooks/nuanban.pb.js** 中必须一致（`scripts/check-api-parity.mjs` 校验路径覆盖）。

| 能力 | Mock | PocketBase | 状态 |
|------|------|------------|------|
| 演示号手机登录 `13800000001`–`06` | ✓ | ✓ seed 对齐 | 一致 |
| 新手机号登录（非演示号） | 创建会话、空 roles → 注册页 | 创建 `m{phone}@test.nuanban.dev`、空 roles | **已对齐** |
| 学校白名单校验 | `isKnownSchool` | `nuanban_lib.isKnownSchool` | **已对齐** |
| 学生 PATCH 学校 | 无效学校 400 | 无效学校 400 | **已对齐** |
| 学生注册默认 status | student=`active`（mock） / pending（PB 新注册） | student=`pending` | PB 新注册走审核；演示 seed 为 active |
| 审核中学生接单 | 前端 nav-guard + | 403 服务端拦截 | **已对齐** |
| 订单 `requirePayment` 延后支付 | `pending_payment` | `pending_payment` | 一致 |
| 储值卡 / 演示微信支付 | localStorage | hooks 内存 store | 一致（演示栈） |
| 提现门槛 ¥10 | ✓ | ✓ | 一致 |
| 提现前绑定收款账户 | 400 | 400 | **已对齐** |
| `X-Active-Role` 校验 | assertDemoActiveRole | assertActiveRoleHeader | 一致 |

同步修改接口时：**同时改** `demo-mock.ts` 与 `nuanban.pb.js`（及 `nuanban_lib.js`）。

---

## 硬约束例外（允许跳过）

这些能力在 GitHub Pages / 零成本演示栈上**无法实现**，Mock 模拟或跳过，正式环境接真实服务时再替换。

| 约束 | 影响 | 测试/ GitHub 处理 | 阿里云后续 |
|------|------|-------------------|------------|
| **无服务端** | GitHub 不能跑 PocketBase | 全量 Mock + localStorage | ECS + Docker PB |
| **短信验证** | 自建（图画验证+服务器 OTP） | 同左；演示号 `000000` | 可换真实 SMS，接口不变 |
| **无真实微信支付** | 不能调起商户 API | 1.5s 模拟 / 储值卡扣款 | 扫呗 / 微信商户（见 PAYMENT.md） |
| **无真实提现打款** | 不能企业付款到零钱 | 演示状态机（pending/completed） | 扫呗分账 / 银行接口 |
| **静态托管无上传落盘** | 核验照不能写服务器盘 | Vite dev 插件 / Mock URL | PB 文件字段 + 未来 OSS |
| **SQLite 单节点** | 非 RDS 高可用 | 本地 / ECS 单容器足够 | 量大时迁 RDS + 对象存储 |
| **备案 / HTTPS** | 域名未备案时无 HTTPS | GitHub 自带 HTTPS | 备案后 Caddy 自动证书 |

文档中凡写「演示」「Mock」「模拟支付」处，均指上述硬约束下的占位实现，**不代表**正式版业务规则不同。

---

## 环境变量规范

### 前端（`packages/miniapp/.env`）

```env
VITE_API_BASE_URL=/api          # 本地 dev 代理；阿里云 build 为 https://域名/api
VITE_RELEASE_CHANNEL=development # 本地 | test | public
VITE_DEMO_MOCK=false            # 本地 parity；GitHub Actions 注入 true
```

`request.ts` 的 `resolveApiBase()` 会在非 localhost 环境自动把 `/api` 解析为 `当前域名/api`，**阿里云无需写死 IP**。

### 后端（仓库根 `.env`）

```env
PB_ENCRYPTION_KEY=...   # 生产必须固定；变更需重建 pb_data
```

### 部署（`config/demo.env`，勿提交）

```env
NUANBAN_DOMAIN=nuanban.cc
NUANBAN_STAGING_IP=101.200.128.82
NUANBAN_SSH=root@...
NUANBAN_REMOTE_DIR=/opt/jinshouzhi/nuanban_github
```

---

## 阿里云部署清单（避免返工）

部署前确认以下项与代码假设一致：

- [ ] **路径**：代码在 `/opt/jinshouzhi/nuanban_github`（或 `NUANBAN_REMOTE_DIR` 与脚本一致）
- [ ] **Compose**：生产用 `docker-compose.yml` + `docker-compose.prod.yml`；备案前临时 HTTP 用 `docker-compose.staging.yml`
- [ ] **端口**：公网仅 **80/443**；8090 绑定 `127.0.0.1`（见 prod compose）
- [ ] **H5 构建**：`VITE_RELEASE_CHANNEL=public`，`VITE_API_BASE_URL=https://${NUANBAN_DOMAIN}/api`
- [ ] **同域 API**：Caddy 反代 `/api` → PocketBase，避免 CORS 与 mixed content
- [ ] **PB_ENCRYPTION_KEY**：首次部署写入根 `.env`，后续不变
- [ ] **Seed**：`./scripts/seed-demo.sh` 或 `pb-init-server.sh` 写入演示号与学校字典
- [ ] **Hooks 热更新**：改 `pb_hooks/` 后 `docker compose restart pocketbase`
- [ ] **发布锁**：`release-prod.sh` 写入 `.release/prod.lock` 供 `release-status.sh` 对比
- [ ] **未来 OSS**：头像 / 核验照当前走 PB 本地文件；上 OSS 时需改 `nuanban_lib` 的 URL 生成，**前端 API 路径不变**
- [ ] **未来 RDS**：当前 SQLite；迁 RDS 时仅换 PB 数据源，**hooks 与 H5 无需改路由**

常用命令：

```bash
# 备案前 HTTP 内测
./scripts/deploy-staging.sh

# 备案后 HTTPS 正式
./scripts/deploy-public.sh

# 已上线增量更新
./scripts/release-prod.sh

# 服务器上 hooks/数据修复 + 重建 H5
./scripts/aliyun-fix-data.sh
```

---

## 构建命令对照

| 场景 | 命令 / 触发 | 关键 env |
|------|-------------|----------|
| 本地 dev（默认） | `./scripts/dev-test.sh` + `./scripts/start-h5.sh` | `development`, `VITE_DEMO_MOCK=false` |
| GitHub Pages | push `main` → Actions | `test`, `VITE_DEMO_MOCK=true`, `VITE_BASE=/jinshouzhi/nuanban/` |
| 阿里云 staging | `deploy-staging.sh` | `public`, API=`http://IP/api` |
| 阿里云 production | `deploy-public.sh` | `public`, API=`https://域名/api` |

---

## 校验脚本

```bash
node scripts/check-api-parity.mjs   # API 路径 mock ↔ hooks
./scripts/audit.sh                  # 路由 + 数据 + 构建 + 冒烟
./scripts/pb-smoke-student.sh       # 部署后学生端 API
./scripts/release-status.sh         # GitHub vs 阿里云 SHA
```

---

## 相关文档

- [RELEASE.md](./RELEASE.md) — 发布流程
- [TEST_VERSION.md](./TEST_VERSION.md) — GitHub 测试备份验收
- [ALIYUN_DEPLOY.md](./ALIYUN_DEPLOY.md) — 服务器首次部署
- [LOCAL_TEST.md](./LOCAL_TEST.md) — 本地 parity 联调
