# V2 走通指南：本地 → GitHub → 阿里云

> **先本地，后公网。** 子域名（`user.` / `control.`）只在阿里云备案上线时需要；Mac 本地开发**不用**配 DNS。

---

## 一张图看懂

```
【阶段 1 · 本地】不用子域名
  localhost:5174  ≈  user.nuanbao.cc     用户登录 / 老人家属学生
  localhost:5175  ≈  control.nuanbao.cc   运营台
  localhost:8090  ≈  两端的 /api          PocketBase

【阶段 2 · GitHub Pages】仍是单站发布版（暂不合子域）
  jushuolot.github.io/.../nuanban/       合一 H5 + 远程 API

【阶段 3 · 阿里云】才配子域名
  user.nuanbao.cc      → h5-user
  control.nuanbao.cc   → h5-control
```

---

## 阶段 1：本地走通（今天先做这一步）

### 1.1 准备环境

- 已安装：Node 18+、Docker Desktop
- 进入项目目录：

```bash
cd /path/to/nuanban_github
```

### 1.2 启动后端 + 测试数据（只需一次，或每天第一次）

**终端 A**：

```bash
./scripts/dev-test.sh
```

等到出现「完成」或 API 健康。这会启动 PocketBase（8090 端口）并写入演示账号。

### 1.3 查看启动说明

```bash
./scripts/start-v2-local.sh
```

会检查 8090 是否就绪，并打印下面两个终端要执行的命令。

### 1.4 启动用户端

**终端 B**（保持运行）：

```bash
./scripts/start-h5-user.sh
```

浏览器打开：

**http://localhost:5174/#/pages/common/login**

- 角标应显示 **正式版**
- 用手机号 `13800000001` 登录（学生示范账号）

### 1.5 启动运营台（另一个终端）

**终端 C**（保持运行）：

```bash
./scripts/start-h5-control.sh
```

浏览器打开：

**http://localhost:5175/#/pages/common/ops-gate**

- 输入口令：`nuanban2026` 或 `暖伴2026`
- 进入六 Tab 运营台（概览 / 学生 / 机构 / 派单 / 资金 / 更多）

### 1.6 验证码怎么拿

本地不走 `000000` 捷径。登录时：

1. 在用户端输入手机号 → 获取验证码  
2. 到运营台 **更多 → 短信发件箱** 查看 6 位码  
3. 回到用户端输入验证码登录

### 1.7 本地验收清单

| 检查项 | 预期 |
|--------|------|
| 用户端 `5174` 能登录学生/家属/老人 | ✓ |
| 用户端**没有**运营台 FAB、点 Logo「暖」无跳转 | ✓ |
| 运营台 `5175` 口令进门、能审学生 | ✓ |
| 学生「附近老人」地图能显示（OSM 瓦片） | ✓ |
| API | `curl -s http://localhost:8090/api/health` 返回 200 |

### 1.8 常见问题

| 现象 | 处理 |
|------|------|
| 打开 `localhost:5174` 出现旧项目页面 | 见下方 **Cursor 内置浏览器** 专节；或 `./scripts/purge-legacy-dev.sh` + Chrome 无痕 |
| 用了 `/login` 路径 | 已废弃，会自动跳转；请用 `http://localhost:5174/#/pages/common/login` |

### 1.9 Cursor 内置浏览器（Simple Browser）

内置浏览器**容易缓存**旧项目页面，请严格按下面做：

1. **关掉**所有 Cursor 里已打开的 `localhost:5174` / `5175` 预览标签（右上角 ×）
2. 终端执行：
   ```bash
   ./scripts/purge-legacy-dev.sh
   ./scripts/start-h5-user.sh
   ```
3. `Cmd+Shift+P`（Mac）→ 输入 **`Simple Browser: Show`** → 回车
4. 地址栏粘贴（整段复制，**含 `#`**）：
   ```
   http://localhost:5174/#/pages/common/login
   ```
5. 若仍是旧页面：`Cmd+Shift+P` → **`Developer: Reload Window`** 重载 Cursor 窗口，再从步骤 3 打开

**不要用** Cursor 地址栏里的 `http://localhost:5174/login`（无 `#` 的旧路径）。

仍不对时，在 Mac 终端用系统浏览器打开（缓存独立、最省事）：

```bash
open 'http://localhost:5174/#/pages/common/login'
```

正确页面：标题 **暖伴勤工**，手机号 + 验证码登录（不是密码）。
| 跑了运营台脚本却开 5174 | 用户端 `5174` + `start-h5-user.sh`；运营台 `5175` + `start-h5-control.sh`，两个终端各跑一个 |
| 端口被占用 | 启动脚本会自动释放端口；仍失败则 `lsof -ti :5174 \| xargs kill -9` |
| 登录 401 / 连不上 API | 确认 `dev-test.sh` 已跑、Docker 里 PocketBase 在跑 |
| 运营台口令不对 | 默认 `nuanban2026`，见 `packages/miniapp/src/utils/ops-mode.ts` |
| 地图空白 | 需联网加载 OSM 瓦片；稍等或刷新 |

---

## 阶段 2：发布 GitHub 发布版（本地验收通过后）

> 当前 GitHub Actions **仍构建合一包**（兼容旧链接），与 V2 双端并行存在；阿里云才用 `user` / `control` 拆分。

```bash
# 在 git 根目录 jinshouzhi
git add nuanban_github/...
git commit -m "feat(nuanban): ..."
./nuanban_github/scripts/release-formal.sh   # push main → Actions 构建 Pages
```

约 2 分钟后访问：

https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login

- 角标：**发布版**
- API 指向阿里云同库（`NUANBAN_FORMAL_API_URL`）

本地 V2 双端测通 **不等于** GitHub 已拆子域；GitHub 这一步主要是同步代码、给外人看发布版。

---

## 阶段 3：阿里云 + 子域名（备案域名就绪后再做）

### 3.1 子域名是什么？

把 `user.nuanbao.cc` 指到你的云服务器 IP，浏览器访问这个地址时，Caddy 返回**用户端**静态文件；`control.nuanbao.cc` 返回**运营台**。

本地 `localhost` 没有「主机记录」概念，所以用 **5174 / 5175 两个端口**代替。

### 3.2 DNS 配置（阿里云控制台）

1. 打开 https://dc.console.aliyun.com/
2. 域名列表 → 点 **nuanbao.cc** → **解析**
3. 点 **添加记录**，填两条：

**记录 1（用户端）**

| 字段 | 填什么 |
|------|--------|
| 记录类型 | A |
| 主机记录 | `user` |
| 记录值 | 你的 ECS 公网 IP（如 `101.200.128.82`） |
| TTL | 10 分钟 |

**记录 2（运营台）**

| 字段 | 填什么 |
|------|--------|
| 记录类型 | A |
| 主机记录 | `control` |
| 记录值 | **同上**同一个 IP |
| TTL | 10 分钟 |

4. 保存。等 5～10 分钟。

5. 在自己电脑验证（应返回服务器 IP）：

```bash
dig +short user.nuanbao.cc
dig +short control.nuanbao.cc
```

### 3.3 安全组

ECS → 安全组 → 入方向放行 **TCP 80、443**。

### 3.4 服务器配置

SSH 登录服务器后：

```bash
cd /opt/jinshouzhi/nuanban_github
cp config/formal.env.example config/formal.env
nano config/formal.env
```

确认内容类似：

```env
NUANBAN_DOMAIN=nuanbao.cc
NUANBAN_USER_HOST=user.nuanbao.cc
NUANBAN_CONTROL_HOST=control.nuanbao.cc
NUANBAN_FORMAL_URL=https://user.nuanbao.cc/#/pages/common/login
NUANBAN_PUBLIC_API=https://user.nuanbao.cc
NUANBAN_STAGING_IP=你的公网IP
NUANBAN_SSH=root@你的公网IP
NUANBAN_REMOTE_DIR=/opt/jinshouzhi/nuanban_github
VITE_MAP_REAL=true
```

### 3.5 部署

```bash
./scripts/deploy-v2.sh
```

### 3.6 公网验收

| 地址 | 预期 |
|------|------|
| https://user.nuanbao.cc/#/pages/common/login | 用户端 |
| https://control.nuanbao.cc/#/pages/common/ops-gate | 运营台 |
| https://user.nuanbao.cc/api/health | API 正常 |

浏览器 **强刷**：`Cmd+Shift+R`。

### 3.7 子域名仍不生效时

1. DNS 是否解析到正确 IP（`dig`）  
2. 安全组 80/443 是否开放  
3. `docker compose logs caddy` 看证书是否申请成功  
4. 域名是否已备案（未备案 HTTPS 可能有问题）

---

## 推荐顺序（给第一次上线的你）

```
① ./scripts/dev-test.sh
② 终端分别 start-h5-user.sh / start-h5-control.sh  → 本地验收
③ git push + release-formal.sh                     → GitHub 发布版
④ 阿里云加 DNS 两条 A 记录 + formal.env + deploy-v2.sh
```

子域名如果一时配不好，**不影响**继续用本地 5174/5175 开发；可以先把 ①②③ 做完，DNS 弄明白了再做 ④。

---

## 相关脚本

| 脚本 | 用途 |
|------|------|
| `start-v2-local.sh` | 打印本地双端启动说明 |
| `start-h5-user.sh` | 用户端 dev :5174 |
| `start-h5-control.sh` | 运营台 dev :5175 |
| `build-h5-variant.sh user\|control` | 构建拆分产物 |
| `deploy-v2.sh` | 阿里云双子域部署 |
| `release-formal.sh` | GitHub Pages |
| `release-prod.sh` | 阿里云稳定版（可 SSH 触发 deploy） |

更多架构说明见 [V2.md](./V2.md)。
