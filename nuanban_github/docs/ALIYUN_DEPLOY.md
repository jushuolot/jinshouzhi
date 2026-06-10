# 暖伴勤工 · 阿里云部署指南

将应用从 **GitHub Pages（Mock 演示）** 迁到 **阿里云轻量服务器（真实 PocketBase API + HTTPS）**。

预计耗时：**30–60 分钟**（备案已完成、域名已解析的前提下）。

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

上线后 **不再使用** GitHub Pages 的 Mock；H5 直连你的域名 `/api`。

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
cd /path/to/jinshouzhi/nuanban_github
cp config/demo.env.example config/demo.env   # 仅首次
# 编辑 config/demo.env 填入 NUANBAN_SSH、NUANBAN_DOMAIN 等

./scripts/sync-public.sh
```

会自动 `git push` + SSH 到服务器 `git pull` + `deploy-public.sh`。

---

## 四、登录与测试账号

上线后使用 **真实 PocketBase API**（非 GitHub Mock）。

| 方式 | 说明 |
|------|------|
| 手机号 | `13800000001`–`06`，验证码可空（演示 hooks） |
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
