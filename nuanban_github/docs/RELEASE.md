# 暖伴勤工 · 发布规则（三环境）

## 环境定义

| 环境 | 角色 | 地址 | 角标 | 数据 |
|------|------|------|------|------|
| **本地** | 测试机 | `http://localhost:5174` | 开发版 | Docker PB + 可选全量 Mock |
| **GitHub Pages** | **正式制作** | https://jushuolot.github.io/jinshouzhi/nuanban/ | **正式版** | 真实 API；**仅游客** Mock |
| **阿里云** | **对外发布** | https://nuanban.cc（备案中可用 IP） | **发布版** | 真实 PocketBase |

原则：**本地测通 → GitHub 正式验收 → 阿里云对外发布**。

外部信息准备见 **[FORMAL_PREP.md](./FORMAL_PREP.md)**。

---

## 日常流程

### 1. 本地测试机

```bash
./scripts/dev-test.sh
cd packages/miniapp && npm run dev:h5
```

`.env` 推荐：

```env
VITE_RELEASE_CHANNEL=development
VITE_DEMO_MOCK=true
VITE_API_BASE_URL=/api
```

### 2. 发布 GitHub 正式版

```bash
git add … && git commit -m "feat: …"
./scripts/release-formal.sh
```

- 推送 `main` → Actions 构建（`VITE_RELEASE_CHANNEL=formal`）
- 需配置仓库 Variable：`NUANBAN_FORMAL_API_URL`
- 验收：https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch

### 3. 发布阿里云对外版

```bash
./scripts/release-prod.sh
```

- `VITE_RELEASE_CHANNEL=public`
- 无 Mock，同域 `/api`

### 4. 查看版本

```bash
./scripts/release-status.sh
```

---

## 构建差异

| 变量 | 本地测试机 | GitHub 正式版 | 阿里云发布版 |
|------|------------|---------------|--------------|
| `VITE_RELEASE_CHANNEL` | `development` | `formal` | `public` |
| `VITE_DEMO_MOCK` | `true`（可选） | **不设** | **不设** |
| 游客 Mock | 是 | 是（仅游客） | 否 |
| 登录用户 API | 本地 PB / Mock | 正式制作 API | 发布 API |

---

## 脚本对照

| 脚本 | 用途 |
|------|------|
| `dev-test.sh` | 本地启动 PocketBase + seed |
| `release-formal.sh` | 推 **GitHub 正式版** |
| `release-prod.sh` | 部署 **阿里云发布版** |
| `release-status.sh` | 对比各环境 SHA |
| `release-test.sh` | 兼容旧名 → `release-formal.sh` |
