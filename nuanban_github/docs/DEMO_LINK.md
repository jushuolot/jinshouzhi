# 暖伴勤工 · 客人演示指南

## 一键获取代码

**GitHub 仓库（单仓，暖伴在子目录）**

https://github.com/jushuolot/jinshouzhi

```bash
git clone https://github.com/jushuolot/jinshouzhi.git
cd jinshouzhi/nuanban_github
```

独立仓（若已同步）：https://github.com/jushuolot/nuanban

---

## 三步启动（约 2 分钟）

**前置**：安装并打开 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1. 后端 + 演示数据
chmod +x scripts/*.sh
./scripts/dev-test.sh

# 2. 前端（新开终端）
cd packages/miniapp
npm install   # 首次
npm run dev:h5

# 3. 浏览器打开（端口以终端提示为准，常见 5174 或 5175）
open "http://localhost:5174/#/pages/common/login"
```

若 5174 被占用，终端会改用 **5175**，请用实际端口。

---

## 演示账号（登录页一键点）

| 按钮 | 账号 | 演示路径 |
|------|------|----------|
| 开发登录（学生） | student1@test.nuanban.dev | 首页待接单 → 发现（列表/地图）→ 我的（接单统计） |
| 开发登录（家属） | family1@test.nuanban.dev | 待支付订单 → 模拟支付 |
| 开发登录（老人） | elder1@test.nuanban.dev | 找陪护 → 学生1 → 一键求助 |

无需改 `.env`，需先执行过 `./scripts/seed-demo.sh`（`dev-test.sh` 已包含）。

---

## 客人本地演示链接格式

```
http://localhost:<端口>/#/pages/common/login
```

示例：`http://localhost:5175/#/pages/common/login`

---

## 公网演示（客人手机/浏览器直接访问）

**一条命令**（需 Docker + Node；推荐先 `brew install cloudflared`）：

```bash
cd nuanban_github
chmod +x scripts/*.sh
./scripts/public-demo.sh
```

脚本会：构建 H5 → 启动 Caddy（8080 端口，H5+API 合一）→ 创建 **HTTPS 公网隧道**。

终端会打印类似：

```
https://xxxx.trycloudflare.com/#/pages/common/login
```

**把整行链接发给客人**，微信/Safari 打开即可，点「开发登录（学生/家属/老人）」演示。

注意：

- 关闭运行脚本的终端后公网链接失效（临时隧道）。
- 若使用 **localtunnel**（`*.loca.lt`），客人首次打开可能看到「Click to Continue」提示页，点一下即可进入；推荐本机安装 `brew install cloudflared` 使用 Cloudflare 隧道，无此步骤。

### 同一 WiFi 内演示（无公网）

脚本失败时会提示局域网地址，例如：

```
http://192.168.x.x:8080/#/pages/common/login
```

手机连同一 WiFi 即可访问。

---

## 管理后台

- PocketBase Admin：http://localhost:8090/_/
- 账号：`admin@nuanban.dev` / `Nuanban2025!`

---

## 常见问题

| 现象 | 处理 |
|------|------|
| 登录失败 | 打开 Docker → `docker compose up -d pocketbase` |
| 发现页一直加载 | 浏览器 **Cmd+Shift+R** 强刷 |
| 地图空白 | H5 需配置地图 SDK；列表模式可完整演示 |
| 端口不对 | 看 `npm run dev:h5` 终端输出的 Local 地址 |

更多见 [LOCAL_TEST.md](./LOCAL_TEST.md)。
