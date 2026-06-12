# 暖伴勤工 · 阿里云部署指南

将应用部署到 **阿里云轻量服务器（正式发布 · PocketBase + HTTPS）**。  
GitHub Pages 为 **测试备份**（Mock，与本地测试同配置）。见 [ENV_PARITY.md](./ENV_PARITY.md) · [RELEASE.md](./RELEASE.md)。

预计耗时：**30–60 分钟**（备案已完成、域名已解析的前提下）。

> **域名 `nuanban.cc` 还在备案中？** 见下方 [备案期间先做什么](#备案期间先做什么)，用服务器 IP 临时跑通；备案通过后再切 HTTPS 正式域。

---

## 备案期间先做什么

备案未通过前，**不能**用 `nuanban.cc` 在大陆服务器上正式对外（阿里云会拦截未备案域名访问）。

| 阶段 | 能做什么 | 不能做什么 |
|------|----------|------------|
| 备案中 | 服务器装环境、用 **公网 IP + HTTP** 内测 | `https://nuanban.cc`、微信小程序正式版 |
| 备案通过 | `./scripts/deploy-public.sh` 一键 HTTPS | — |

### 现在就可以在服务器执行

```bash
git clone https://github.com/jushuolot/jinshouzhi.git /opt/jinshouzhi
cd /opt/jinshouzhi/nuanban_github
chmod +x scripts/*.sh
sudo ./scripts/aliyun-bootstrap.sh

cp config/demo.env.example config/demo.env
nano config/demo.env
# 填入 NUANBAN_STAGING_IP=你的公网IP
# 预先写好 NUANBAN_DOMAIN=nuanban.cc（备案通过后直接用）

./scripts/deploy-staging.sh
```

- 安全组放行 **TCP 80**（临时测试）
- 浏览器访问：`http://你的公网IP/#/pages/common/login`
- 管理后台：`http://你的公网IP/_/`

### 备案通过后（约 1 条命令切换）

1. 域名控制台：`nuanban.cc` A 记录 → 服务器 IP  
2. 安全组确保 **80、443** 已放行  
3. 服务器执行：

```bash
cd /opt/jinshouzhi/nuanban_github
./scripts/deploy-public.sh
```

正式链接变为：`https://nuanban.cc/#/pages/common/login`

---

## 架构

```
用户浏览器 / 微信小程序
        │
        ▼
  https://nuanban.cc  （或 nuanban.v2way.com）
        │
   Caddy :443（自动 HTTPS）
   ├── /          → H5 静态页（uni-app build）
   ├── /api/*     → PocketBase
   └── /_/*       → PocketBase 管理后台
```

正式版 H5 直连你的域名 `/api`；GitHub Pages 继续作为测试版保留。

---

## 前置条件

| 项 | 要求 |
|----|------|
| 阿里云 | 轻量应用服务器 **2核4G** 推荐，**Ubuntu 22.04** |
| 域名 | `nuanban.cc` 和/或 `v2way.com`，**公司主体 ICP 备案**已完成 |
| DNS | A 记录指向服务器公网 IP，例如 `nuanban.cc` → `47.x.x.x` |
| 安全组 | 入站放行 **80、443**（不要公网开放 8090） |
| 本地 | 可 `ssh root@服务器IP`，代码已 push 到 GitHub |

### 推荐域名分工（公司主体）

| 域名 | 用途 |
|------|------|
| `nuanban.cc` | 暖伴产品对外（H5 + API 同域最简单） |
| `v2way.com` | 公司其他项目子域名（可选，暖伴也可用子域） |

**最简单方案**：`NUANBAN_DOMAIN=nuanban.cc`，API 为 `https://nuanban.cc/api`。

---

## 一、服务器首次初始化

SSH 登录阿里云服务器后：

```bash
# 克隆单仓（推荐）
git clone https://github.com/jushuolot/jinshouzhi.git /opt/jinshouzhi
cd /opt/jinshouzhi/nuanban_github

# 初始化 Docker、Node、.env
chmod +x scripts/*.sh
sudo ./scripts/aliyun-bootstrap.sh
```

### 配置域名

```bash
cp config/demo.env.example config/demo.env
nano config/demo.env
```

示例（按你的实际修改）：

```bash
NUANBAN_DOMAIN=nuanban.cc
NUANBAN_DEMO_URL=https://nuanban.cc/#/pages/common/login
NUANBAN_SSH=root@47.x.x.x
NUANBAN_REMOTE_DIR=/opt/jinshouzhi/nuanban_github
```

---

## 二、一键部署（在服务器执行）

```bash
cd /opt/jinshouzhi/nuanban_github
./scripts/deploy-public.sh
```

脚本会自动：

1. 生成 `Caddyfile.prod`（HTTPS）
2. 启动 PocketBase（Docker）
3. 写入演示数据（`seed-demo.sh`）
4. 构建 H5（`VITE_API_BASE_URL=https://你的域名/api`）
5. 启动 Caddy（80/443）

### 部署成功标志

```bash
curl -s https://nuanban.cc/api/health
# 应返回 JSON，含 "code":200

# 浏览器打开
# https://nuanban.cc/#/pages/common/login
```

### 管理后台

| 项 | 值 |
|----|-----|
| 地址 | `https://nuanban.cc/_/` |
| 首次 | 若无法登录，执行 `./scripts/pb-reset-admin.sh` |
| 默认账号 | `admin@nuanban.dev` / `Nuanban2025!` |

---

## 三、本地开发机同步更新

以后在 Cursor 改完代码 push 后，在本机执行：

```bash
# 推荐：暖伴 + 古蜀秘档 一并同步
cp scripts/aliyun.env.example scripts/aliyun.env
chmod +x scripts/aliyun-sync-all.sh
./scripts/aliyun-sync-all.sh
```

或仅暖伴：

```bash
cd /path/to/jinshouzhi/nuanban_github
cp config/demo.env.example config/demo.env
./scripts/sync-public.sh
```

会自动 `git push` + SSH 到服务器 `git pull` + `deploy-public.sh`。

古蜀秘档访问：`https://你的域名/game/`（静态目录 `/opt/jinshouzhi/match3-game`）。

---

## 四、登录与测试账号

上线后使用 **真实 PocketBase API**（非 GitHub Mock）。

| 方式 | 说明 |
|------|------|
| 手机号 | `13800000001`–`06`，验证码填 **`000000`**（演示 hooks） |
| 开发登录 | 需先 `seed-demo.sh`；密码见 `packages/pocketbase/SEED.md` |

演示手机号对照见 [DEMO_LINK.md](./DEMO_LINK.md)。

---

## 五、微信小程序（公司主体）

备案域名就绪后，在微信公众平台配置：

| 配置项 | 值 |
|--------|-----|
| request 合法域名 | `https://nuanban.cc` |
| 业务域名 | `https://nuanban.cc` |

重新构建小程序：

```bash
cd packages/miniapp
VITE_API_BASE_URL=https://nuanban.cc/api npm run build:mp-weixin
```

用 HBuilderX 上传审核。

---

## 六、运维命令

```bash
cd /opt/jinshouzhi/nuanban_github

# 状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy pocketbase

# 重新部署
./scripts/deploy-public.sh

# 仅刷新演示数据
NUANBAN_API=http://localhost:8090 ./scripts/seed-demo.sh

# 备份（定期执行）
tar czf ~/pb_data-backup-$(date +%Y%m%d).tar.gz packages/pocketbase/pb_data
```

---

## 七、故障排查

| 现象 | 处理 |
|------|------|
| 无法访问 HTTPS | 检查 DNS 是否生效、`dig nuanban.cc`；安全组 80/443 |
| 证书申请失败 | 确认 80 端口可从公网访问；查看 `docker compose logs caddy` |
| H5 白屏 | 重新 `./scripts/deploy-public.sh` 确保 H5 已 build |
| API 404 | 客户端应为 `https://域名/api`，不是 `/api/v1` |
| 仍走 Mock 数据 | 确认访问的是阿里云域名，不是 `github.io` |
| 后台登不上 | `./scripts/pb-reset-admin.sh` |
| 登录提示「用户不存在」/ seed-demo 400 | 在服务器执行 `./scripts/aliyun-fix-data.sh`（拉代码 + 导入集合 + 演示数据） |
| pb-init 集合导入无输出 | 已修复：`fields`→`schema` 转换；失败会打印 HTTP 状态并退出 |
| 首页/资料「加载失败」、`assertActiveRoleHeader is not defined` | 执行 `./scripts/aliyun-fix-data.sh`（需含 `pb_hooks/nuanban_lib.js` 并重启 PocketBase + 重建 H5） |

### 一键修复演示数据（备案期间 IP 访问）

```bash
cd /opt/jinshouzhi/nuanban_github
./scripts/aliyun-fix-data.sh
```

成功后用手机号 `13800000001`、验证码 **`000000`** 登录：`http://101.200.128.82/#/pages/common/login`

### 日常同步：一条命令（不用分三处手动跑）

GitHub 是中间枢纽：**本地 push → 阿里云 pull 部署**。你只需在**当前所在机器**执行一次：

| 你在哪里 | 一条命令 |
|----------|----------|
| **阿里云 Workbench**（推荐，最省事） | `cd /opt/jinshouzhi/nuanban_github && ./scripts/sync-all.sh` |
| **本地 Mac**（改完代码并已 `git commit`） | `cd nuanban_github && ./scripts/sync-all.sh` |

- **Workbench 上**：自动 `git pull` → 重启 PocketBase → 种子数据 → 重建 H5 → API 自检  
- **Mac 上**：自动 `git push` 到 GitHub；若 `config/demo.env` 配了 `NUANBAN_SSH`，会 SSH 连服务器部署；**没配 SSH** 时脚本会打印 Workbench 里要粘贴的那一条命令  

仅检查三地是否一致（不部署）：

```bash
./scripts/sync-check.sh
```

### git pull 超时 / SSL_ERROR_SYSCALL

国内 ECS 访问 GitHub 常不稳定。在 Workbench 执行：

```bash
cd /opt/jinshouzhi/nuanban_github
chmod +x scripts/*.sh
./scripts/git-pull-cn.sh
./scripts/sync-all.sh
```

或手动配置镜像后 `git pull`：

```bash
git config --global url."https://ghfast.top/https://github.com/".insteadOf "https://github.com/"
cd /opt/jinshouzhi/nuanban_github && git pull
```

---

## 八、与 GitHub Pages 的关系

| 环境 | 地址 | 数据 |
|------|------|------|
| GitHub Pages（旧） | `jushuolot.github.io/.../nuanban` | 浏览器 Mock |
| 阿里云（新） | `https://nuanban.cc` | 真实 PocketBase |

正式对外请使用 **阿里云链接**；GitHub Pages 可保留作离线演示备份。

---

## 九、费用参考

| 项 | 约 |
|----|-----|
| 轻量 2核4G | ¥80–120/月（活动价更低） |
| 域名续费 | ¥30–80/年 |
| SSL | 免费（Caddy） |
| RDS | **不需要**（SQLite） |
