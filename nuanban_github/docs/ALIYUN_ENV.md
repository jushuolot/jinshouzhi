# 暖伴勤工 · 阿里云生产环境说明

供 **写代码、改接口、发布正式版** 时对照。部署步骤见 [ALIYUN_DEPLOY.md](./ALIYUN_DEPLOY.md)，发布流程见 [RELEASE.md](./RELEASE.md)。

---

## 环境对照

| 项 | 本地测试机 | GitHub（正式制作） | 阿里云（对外发布） |
|----|------------|-------------------|-------------------|
| 地址 | `localhost:5174` | `jushuolot.github.io/.../nuanban` | `nuanban.cc` / IP |
| 角标 | 开发版 | **正式版** | **发布版** |
| `VITE_RELEASE_CHANNEL` | `development` | `formal` | `public` |
| Mock | 可全量（`VITE_DEMO_MOCK`） | **仅游客** | 无 |
| 发布命令 | `dev-test.sh` | `release-formal.sh` | `release-prod.sh` |
| 服务器路径 | — | `/opt/jinshouzhi/nuanban_github` |

原则：**先 GitHub 测试版验收，再显式 `release-prod.sh` 发阿里云**。本地 `git push` **不会**自动部署正式版。

---

## 网络与 API

### 同域反代（推荐）

Caddy 在同一域名下提供 H5 与 API，**避免 H5 跨域**：

```
浏览器 → http(s)://域名或IP/
         ├── /          → H5 静态资源（packages/miniapp/dist/build/h5）
         ├── /api/*     → PocketBase :8090（仅本机，不对公网开放 8090）
         └── /_/*       → PocketBase 管理后台
```

### API Base URL 解析

| 场景 | 构建时 `VITE_API_BASE_URL` | 运行时实际请求 |
|------|---------------------------|----------------|
| GitHub Pages | `/api` | Mock，不走网络 |
| 阿里云 IP 备案期 | `http://101.200.128.82/api` | 同 IP `/api` |
| 阿里云 HTTPS | `https://nuanban.cc/api` | 同域 `/api` |
| 本地 dev | `/api` | Vite 代理 → `localhost:8090` |

前端 `resolveApiBase()`（`packages/miniapp/src/utils/request.ts`）规则：

- 构建为 `/api` 且 **非** localhost → 使用 `window.location.origin + '/api'`
- 构建为 `http://localhost:8090/api` 且线上访问 → 纠正为当前站点 `/api`
- **禁止**在正式版构建中写死 `github.io` 或 `localhost`

### HTTPS vs HTTP

| 阶段 | 协议 | 说明 |
|------|------|------|
| 备案中 | HTTP + 公网 IP | `deploy-staging.sh` / `aliyun-fix-data.sh` |
| 备案通过 | HTTPS + 域名 | `deploy-public.sh`，Caddy 自动证书 |
| 安全组 | 80（备案期）、80+443（正式） | **不要**公网开放 8090 |

### CORS

生产通过 **Caddy 同域** 提供 H5 与 `/api`，一般无跨域问题。`docker-compose.prod.yml` 中 PocketBase 带 `--origins=*` 作为兜底；本地 dev 跨域时走 Vite 代理。

---

## 部署路径与脚本

| 路径 / 脚本 | 作用 |
|-------------|------|
| `/opt/jinshouzhi/nuanban_github` | 服务器 monorepo 根（暖伴） |
| `config/demo.env` | `NUANBAN_STAGING_IP`、`NUANBAN_DOMAIN`、`NUANBAN_SSH` 等（勿提交 git） |
| `scripts/release-prod.sh` | 正式发布：pull → `aliyun-fix-data.sh` → 写 `.release/prod.lock` |
| `scripts/aliyun-fix-data.sh` | 重启 PB、导入集合、seed、**production 构建 H5**、重启 Caddy |
| `scripts/sync-all.sh` | 本地 → `release-test.sh`；服务器 → `release-prod.sh` |
| `scripts/git-pull-cn.sh` | 国内 ECS 拉 GitHub 镜像加速 |
| `scripts/sync-check.sh` | 对比本地 / GitHub / 公网 API 健康 |

### 日常更新（维护者）

```bash
# 本地：改完并 commit 后
./scripts/release-test.sh          # 推 GitHub，等 Actions 构建 Pages

# 测试版验收通过后（任选其一）
./scripts/release-prod.sh          # 本机已配 NUANBAN_SSH
# 或阿里云 Workbench：
cd /opt/jinshouzhi/nuanban_github && ./scripts/sync-all.sh
```

发布后 **Cmd+Shift+R（Ctrl+Shift+R）强刷**，避免浏览器/CDN 缓存旧 JS。

---

## 写代码时的约束

### 1. Mock 与正式版分流

- `isDemoMockEnabled()`：`VITE_DEMO_MOCK=true` **或** 运行在 `*.github.io/.../nuanban`
- 阿里云 IP/域名 **不会** 自动启用 Mock；必须走 `request()` → PocketBase
- 改 API 时 **同时** 更新 `demo-mock.ts` 与 `pb_hooks/nuanban.pb.js`（见 `AGENTS.md`）

### 2. localStorage 仅测试版

以下键只在 Mock 演示栈有效，**正式版数据在服务端**：

| 键 | 用途 |
|----|------|
| `nuanban_demo_state_v3` | 订单/SOS/外出等演示状态 |
| `nuanban_wallet_v1` | 家属储值卡 |
| `nuanban_student_wallet_v1` | 学生提现 |
| `nuanban_referral_v1` | 推荐奖励（Mock 路径） |

不要在正式版逻辑里依赖这些键持久化业务数据。

### 3. 登录差异

| 能力 | 测试版 | 正式版 |
|------|--------|--------|
| 虚拟手机登录入口 | 显示（`isVirtualPhoneLoginEnabled`） | 不显示（非 DEV、非 Mock） |
| 演示号验证码 | 可留空 | 可留空（hooks `phone-login`） |
| 微信登录 | Mock `demo` code | 需真实小程序 `uni.login` |
| `dev-login` | 本地 dev | 服务器上不应对外暴露给客人 |

### 4. 外链与防火墙

阿里云 ECS 出站一般可用，但以下 **第三方依赖** 在部分网络可能失败，写功能时需知：

| 依赖 | 位置 | 风险 |
|------|------|------|
| `api.qrserver.com` | 老人绑定码页二维码 | 出站受限时二维码空白；复制链接仍可用 |
| `github.com` | 服务器 `git pull` | 用 `git-pull-cn.sh` 镜像 |
| `ifconfig.me` / `icanhazip.com` | 脚本探测公网 IP | 失败时需在 `demo.env` 手写 `NUANBAN_STAGING_IP` |

**不要**在核心业务流程中硬依赖不可控外网（支付、地图、统计等应同域或国内可访问服务）。

### 5. H5 链接与邀请码

服务端返回的 `inviteLink`、`demoUrl` 等应使用 **当前请求站点**（`requestOrigin` / `h5AppBaseUrl`），勿写死 `github.io`。测试版分享页（`share-demo.vue`）刻意指向 GitHub Pages，仅用于验收分发。

### 6. 缓存

- Caddy 对 `index.html` 在 staging 配置 `Cache-Control: no-cache`
- 用户侧仍可能缓存旧 chunk → 强刷或清站点数据
- 构建产物在 `packages/miniapp/dist/build/h5`，由 `aliyun-fix-data.sh` 重建后 Caddy 挂载

---

## 常见踩坑

| 现象 | 原因 | 处理 |
|------|------|------|
| 正式版仍像 Mock / 数据不对 | 打开了 `github.io` 或浏览器缓存旧包 | 确认 URL 为 IP/域名且见「正式版」角标；强刷 |
| API 连到 `localhost:8090` | 构建未用 production 变量或 `resolveApiBase` 未生效 | 服务器执行 `aliyun-fix-data.sh` |
| 登录「用户不存在」 | 未 seed / 集合未导入 | `./scripts/aliyun-fix-data.sh` |
| `git pull` 超时 | 国内访问 GitHub 不稳定 | `./scripts/git-pull-cn.sh` |
| 提示「打开 Docker Desktop」 | 线上用了本地 dev 错误文案 | 应显示网络重试提示（已按环境区分） |
| 推荐链接指向 github.io | hooks 写死测试 URL | 使用 `h5AppBaseUrl(e)` |
| 二维码不显示 | `api.qrserver.com` 不可达 | 用「复制绑定链接」；后续可改本地生成 |
| 8090 被扫描 | 安全组误开放 | 仅 `127.0.0.1:8090`，公网只开 80/443 |

---

## 构建变量速查（正式版）

在服务器执行（`aliyun-fix-data.sh` 已内置）：

```bash
cd packages/miniapp
VITE_RELEASE_CHANNEL=production \
VITE_API_BASE_URL="http://101.200.128.82/api" \   # 或 https://nuanban.cc/api
npm run build:h5
```

**不要**设置 `VITE_DEMO_MOCK=true`。

---

## 相关文档

| 文档 | 内容 |
|------|------|
| [RELEASE.md](./RELEASE.md) | 测试版 / 正式版发布规则 |
| [ALIYUN_DEPLOY.md](./ALIYUN_DEPLOY.md) | 首次服务器部署 |
| [TEST_VERSION.md](./TEST_VERSION.md) | GitHub 测试版验收 |
| [LOCAL_TEST.md](./LOCAL_TEST.md) | 本地 Docker + 真实 API |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | 通用排错 |
