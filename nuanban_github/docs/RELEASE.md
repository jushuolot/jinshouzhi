# 暖伴勤工 · 发布规则（三环境）

## 环境定义

| 环境 | 角色 | 地址 | 角标 | 数据 |
|------|------|------|------|------|
| **本地测试机** | 与正式一致验收 | `http://localhost:5174` | 开发版 | PocketBase（推荐 `VITE_DEMO_MOCK=false`） |
| **GitHub Pages** | **测试备份** | https://jushuolot.github.io/jinshouzhi/nuanban/ | **测试版** | 全量 Mock（硬约束：无服务端） |
| **阿里云** | **正式发布** | https://nuanban.cc（备案中可用 IP） | **发布版** | 真实 PocketBase |

原则：**本地 parity 测通 → push 更新 GitHub 测试备份 → 阿里云正式发布**。  
环境差异与硬约束见 **[ENV_PARITY.md](./ENV_PARITY.md)**。

---

## 日常流程

### 1. 本地测试机（与阿里云同逻辑）

```bash
./scripts/dev-test.sh
./scripts/start-h5.sh
```

`.env` 推荐（parity 模式）：

```env
VITE_RELEASE_CHANNEL=development
VITE_DEMO_MOCK=false
VITE_API_BASE_URL=/api
```

纯 Mock（不启 PB）可将 `VITE_DEMO_MOCK=true`。

### 2. 更新 GitHub 测试备份

```bash
git add … && git commit -m "feat: …"
./scripts/release-test.sh   # → release-formal.sh，push main
```

- Actions 构建：`VITE_RELEASE_CHANNEL=test`，`VITE_DEMO_MOCK=true`
- 验收：https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch

### 3. 发布阿里云正式版

```bash
./scripts/release-prod.sh
```

- `VITE_RELEASE_CHANNEL=public`，无 Mock，同域 `/api`

### 4. 查看版本

```bash
./scripts/release-status.sh
```

---

## 构建差异

| 变量 | 本地 parity | GitHub 测试备份 | 阿里云发布 |
|------|-------------|-----------------|------------|
| `VITE_RELEASE_CHANNEL` | `development` | `test` | `public` |
| `VITE_DEMO_MOCK` | `false`（推荐） | **`true`** | **不设** |
| 登录用户 API | PocketBase | Mock | PocketBase |
| 业务 hooks | `nuanban.pb.js` | `demo-mock.ts` 镜像 | `nuanban.pb.js` |

---

## 脚本对照

| 脚本 | 用途 |
|------|------|
| `dev-test.sh` | 本地启动 PocketBase + seed |
| `release-formal.sh` | 推 **GitHub 测试备份** |
| `release-prod.sh` | 部署 **阿里云发布版** |
| `release-status.sh` | 对比各环境 SHA |
| `release-test.sh` | 兼容旧名 → `release-formal.sh` |
| `deploy-staging.sh` | 备案中 HTTP 临时部署 |
| `deploy-public.sh` | 备案后 HTTPS 正式部署 |
