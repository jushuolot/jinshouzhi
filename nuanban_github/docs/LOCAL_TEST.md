# 本地测试指南

仓库：**https://github.com/jushuolot/nuanban**

---

## 一、克隆项目

```bash
git clone https://github.com/jushuolot/nuanban.git
cd nuanban
```

---

## 二、启动后端（Docker + PocketBase）

**前置**：安装并打开 [Docker Desktop](https://www.docker.com/products/docker-desktop/)（菜单栏出现鲸鱼图标）。

```bash
chmod +x scripts/*.sh

# 方式 A：一键（推荐）
./scripts/dev-test.sh

# 方式 B：分步
docker compose up -d pocketbase
curl http://localhost:8090/api/health    # 应返回 API is healthy
./scripts/seed-demo.sh
```

`seed-demo` 会写入：

- 三角色演示账号（student / family / elder）
- 学校字典、养老院、2 位上海附近老人（张奶奶、李爷爷）

---

## 三、启动 H5 前端

**新开一个终端**：

```bash
cd packages/miniapp
cp .env.example .env    # 首次需要；已有 .env 可跳过
npm install             # 首次需要
npm run dev:h5
```

浏览器请用暖伴专用启动脚本：

```bash
./scripts/start-h5.sh
```

打开：**http://localhost:5174/#/pages/common/launch**

若端口被占用，脚本会自动释放 5174 后启动；页面标题应为 **暖伴勤工**。

`.env` 默认：

```
VITE_API_BASE_URL=/api
VITE_DEV_AUTH_EMAIL=student1@test.nuanban.dev
```

Vite 会把 `/api` 代理到 `http://localhost:8090`。本地 `npm run dev:h5` 自动启用**虚拟手机登录**（无需短信）。

---

## 四、登录与三角色体验

登录页点 **「虚拟手机登录 · 点按选择测试号」** 或底部 **测试账号**，一键登录（验证码可留空）：

| 手机号 | 角色 | 登录后首页 |
|--------|------|------------|
| `13800000001` | 学生主流程 | 学生端首页，「待接单 N」 |
| `13800000004` | 家属 | 家属端首页，「待支付订单」 |
| `13800000005` | 老人 | 老人端首页，「找陪护」「一键求助」 |
| `13800000006` | 三角色 | 身份切换演示 |

### 学生端预期

1. 首页：**待接单 1**（seed 后有一条待接单）、底部 Tab（首页 / 发现 / 我的）
2. 点击 **发现**：附近老人列表，应看到 **张奶奶**（约 0km）、**李爷爷**（约 0.8km）
3. 点击老人卡片可进入订单详情页

### 家属端预期

1. 首页标题 **家属端**
2. 卡片 **待支付订单** → 模拟支付页（seed 后应有 1 条待支付订单）
3. 底部 Tab：首页 / 订单 / 我的

### 老人端预期

1. 大字号 **您好**，副标题「今日有人陪伴您」
2. 按钮 **找陪护** → 附近同学列表（seed 后应看到 **学生1**）
3. **一键求助** → Toast「已发送求助」

### 注册入口（可选）

登录页底部：**老人注册 / 家属注册 / 学生注册**

---

## 五、管理后台

| 项 | 值 |
|----|-----|
| 地址 | http://localhost:8090/_/ |
| 管理员 | admin@nuanban.dev / Nuanban2025! |
| 忘记密码 | `./scripts/pb-reset-admin.sh` |
| 导入模型 | Settings → Import collections → `packages/pocketbase/pb_schema.json`（勾选 Merge） |

---

## 六、命令行快速验证

```bash
# 健康检查
curl http://localhost:8090/api/health

# 三角色 dev-login
for email in student1@test.nuanban.dev family1@test.nuanban.dev elder1@test.nuanban.dev; do
  echo "=== $email ==="
  curl -sS -X POST http://localhost:8090/api/nuanban/dev-login \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\"}"
  echo ""
done

# 学生 token 拉取附近老人
TOKEN=$(curl -sS -X POST http://localhost:8090/api/nuanban/dev-login \
  -H 'Content-Type: application/json' \
  -d '{"email":"student1@test.nuanban.dev"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8090/api/collections/elders/records?filter=enabled%3Dtrue"
```

---

## 七、常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| **请求失败** / 登录无响应 | Docker 未开，8090 连不上 | 打开 Docker Desktop → `docker compose up -d pocketbase` |
| Toast：**后端未启动…** | 同上 | 按提示执行 `docker compose up -d pocketbase` |
| **连接服务器超时，点击屏幕重试** | 分包 JS 加载失败（曾见错误 import） | **Cmd+Shift+R** 强刷；确认只有一个 `npm run dev:h5` |
| 开发登录提示用户不存在 | 未 seed | `./scripts/seed-demo.sh` |
| 发现页「暂无附近老人」 | 未 seed 老人档案 | `./scripts/seed-demo.sh`（应写入张奶奶、李爷爷） |
| 页面是旧版 / 按钮不对 | 浏览器缓存 | Cmd+Shift+R；或重启 dev server |
| H5 接口 404 | 代理未生效 | 确认 `.env` 中 `VITE_API_BASE_URL=/api`，PocketBase 在 8090 |
| `docker: command not found` | 未装 Docker | 安装 Docker Desktop |
| 微信开发者工具 | 需配置域名白名单 | `npm run dev:mp-weixin`，工具里勾选「不校验合法域名」 |

更多见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。

---

## 八、推荐测试顺序（给新同学）

1. `./scripts/dev-test.sh` → 确认 health + seed 成功
2. `cd packages/miniapp && npm run dev:h5`
3. 打开登录页 → 选测试号 `13800000001` → 首页 → **发现** → 看到 2 位老人
4. 退出或清缓存后 → 选 `13800000004` → 点「待支付订单」
5. 再试 `13800000005` → 点「找陪护」
6. 可选：底部注册链接走一遍注册页

---

## 九、推送代码（维护者）

```bash
git add -A
git status   # 勿提交 .env、pb_data、pb_data.bak
git commit -m "说明"
git push origin main
```
