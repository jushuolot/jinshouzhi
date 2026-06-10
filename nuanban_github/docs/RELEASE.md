# 暖伴勤工 · 发布规则

## 双环境定义

| 环境 | 角色 | 地址 | 数据/API |
|------|------|------|----------|
| **GitHub Pages** | **最新测试版** | https://jushuolot.github.io/jinshouzhi/nuanban/ | 前端 Mock，无需服务器 |
| **阿里云** | **正式发布版** | http://101.200.128.82（备案后 `https://nuanban.cc`） | 真实 PocketBase |

原则：**先测后发** — 所有功能先在 GitHub 测试版验收，再发布到阿里云正式版。

---

## 日常流程

### 1. 开发完成 → 发布测试版

```bash
git add … && git commit -m "feat: …"
./scripts/release-test.sh
```

- 推送 `main` 到 GitHub
- GitHub Actions 自动构建 Pages（约 2～5 分钟）
- 登录页显示 **「测试版」** 角标
- 验收链接：https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login  
完整测试文档：[TEST_VERSION.md](./TEST_VERSION.md)

### 2. 测试版验收通过 → 发布正式版

**方式 A — 本地一键（已配置 SSH）**

```bash
./scripts/release-prod.sh
```

**方式 B — 阿里云 Workbench**

```bash
cd /opt/jinshouzhi/nuanban_github && ./scripts/release-prod.sh
```

- 拉取与 GitHub `main` 相同提交
- 重建 H5（`VITE_RELEASE_CHANNEL=production`，无 Mock）
- 重启 PocketBase + Caddy
- 登录页显示 **「正式版」** 角标
- 浏览器 **Cmd+Shift+R** 强刷

### 3. 查看当前版本

```bash
./scripts/release-status.sh
```

对比：本地 HEAD、GitHub `main`、阿里云已部署 SHA。

---

## 脚本对照

| 脚本 | 用途 |
|------|------|
| `release-test.sh` | 发布 **测试版** → 仅推 GitHub |
| `release-prod.sh` | 发布 **正式版** → 仅部署阿里云 |
| `release-status.sh` | 查看测试/正式版本是否一致 |
| `sync-all.sh` | 自动识别环境：本地=测试发布，服务器=正式发布 |
| `sync-check.sh` | 检测代码与 API 健康 |

> **不要**在本地 `git push` 后自动部署阿里云。正式版必须显式执行 `release-prod.sh`。

---

## 构建差异

| 变量 | GitHub 测试版 | 阿里云正式版 |
|------|---------------|--------------|
| `VITE_RELEASE_CHANNEL` | `test` | `production` |
| `VITE_DEMO_MOCK` | `true` | 未设置（真实 API） |
| `VITE_API_BASE_URL` | `/api`（Mock） | `http://IP/api` 或 `https://域名/api` |

---

## 备案通过后首次 HTTPS

```bash
cd /opt/jinshouzhi/nuanban_github
# 配置 config/demo.env 中 NUANBAN_DOMAIN=nuanban.cc
./scripts/deploy-public.sh
```

之后日常更新仍用 `./scripts/release-prod.sh`（内部调用 `aliyun-fix-data.sh`）。
