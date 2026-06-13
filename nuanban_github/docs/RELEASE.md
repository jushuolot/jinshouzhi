# 暖伴勤工 · 发布规则（三环境）

## 环境定义

| 环境 | 角色 | 地址 | 角标 | 数据 |
|------|------|------|------|------|
| **本地** | 最新产品验证 | `http://localhost:5174` | **正式版** | PocketBase 测试数据 + 正式登录流 |
| **GitHub Pages** | **发布版** | https://jushuolot.github.io/jinshouzhi/nuanban/ | **发布版** | 真实 API（与阿里云同库） |
| **阿里云** | **发布稳定版** | http://101.200.128.82（备案后 nuanban.cc） | **发布稳定版** | PocketBase 生产数据 |

原则：**本地正式版测通 → GitHub 发布版 → 阿里云发布稳定版**。  
环境差异见 **[ENV_PARITY.md](./ENV_PARITY.md)**。

---

## 日常流程

### 1. 本地（正式版 · 真实流程）

```bash
./scripts/dev-test.sh
./scripts/start-h5.sh
```

`.env`：`VITE_RELEASE_CHANNEL=formal`，`VITE_DEMO_MOCK=false`

### 2. 发布 GitHub 发布版

```bash
git add … && git commit -m "feat: …"
./scripts/release-formal.sh   # push main → Actions 构建 Pages
```

- Actions：`VITE_RELEASE_CHANNEL=release`，`VITE_API_BASE_URL=${NUANBAN_FORMAL_API_URL}`（不设 `VITE_DEMO_MOCK`）
- 验收角标：**发布版**；登录走真实 API，游客仍 Mock

### 3. 发布阿里云稳定版

```bash
./scripts/release-prod.sh
```

- 构建：`VITE_RELEASE_CHANNEL=stable`，无 Mock，同域 `/api`
- 角标：**发布稳定版**

### 4. 查看版本

```bash
./scripts/release-status.sh
```

---

## 构建差异

| 变量 | 本地 | GitHub 发布版 | 阿里云稳定版 |
|------|------|---------------|--------------|
| `VITE_RELEASE_CHANNEL` | `formal` | `release` | `stable` |
| `VITE_DEMO_MOCK` | `false` | 不设 | 不设 |
| `VITE_API_BASE_URL` | `/api`（代理） | `NUANBAN_FORMAL_API_URL` | 同域 `/api` |
| 角标 | 正式版 | 发布版 | 发布稳定版 |

---

## 脚本对照

| 脚本 | 用途 |
|------|------|
| `dev-test.sh` | 本地 PocketBase + seed |
| `start-h5.sh` | 本地 H5 正式版 |
| `release-formal.sh` | 推 **GitHub 发布版** |
| `release-prod.sh` | 部署 **阿里云发布稳定版** |
| `release-test.sh` | 兼容旧名 → `release-formal.sh` |
| `release-status.sh` | 对比发布版 / 稳定版 SHA |
