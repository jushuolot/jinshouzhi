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

## 公网在线演示（可选）

当前版本 **未内置** 公网托管。客人需 **克隆仓库 + 本地运行**。

若需临时公网链接，维护者可自行：

```bash
# 示例：Cloudflare Tunnel（需安装 cloudflared）
cloudflared tunnel --url http://localhost:5175
```

将生成的 `*.trycloudflare.com` 地址发给客人，后缀加 `/#/pages/common/login`。

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
