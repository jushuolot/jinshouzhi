# 本地测试指南

仓库：**https://github.com/jushuolot/nuanban**

> **验收记录（2026-06-05）** · 本地 **正式版**（非 Mock）  
> | 项 | 值 |
> |----|-----|
> | 前端渠道 | `VITE_RELEASE_CHANNEL=formal`（登录页角标 **正式版**） |
> | 数据源 | `VITE_DEMO_MOCK=false` → PocketBase `:8090` |
> | 鉴权 | `NUANBAN_FORMAL_AUTH=true`（须九宫格 + 短信，**无** `000000` 万能码） |
> | 角色头 | 客户端 `X-Active-Role`（订单聊天/语音通话 **必须** 携带） |
> | 产品冒烟 | `node scripts/test-product-smoke.mjs` → **29/29**（老人·家属·运营·语音） |
> | 学生审核 | `node scripts/test-student-audit-flow.mjs` → **20/20** |

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

## 三、启动 H5 前端（parity · 非 Mock）

**新开一个终端**（在 `nuanban_github` 目录）：

```bash
./scripts/start-h5.sh
```

打开：**http://localhost:5174/#/pages/common/login**

脚本会创建/修正 `packages/miniapp/.env`，**强制**：

- `VITE_DEMO_MOCK=false`（走 PocketBase，非浏览器 Mock）
- `VITE_RELEASE_CHANNEL=formal`（角标 **正式版**，与发布版相同的真实登录流）

浏览器 Mock（`demo-mock.ts`）**仅**用于 GitHub Pages，本地不要开。

若端口被占用，脚本会自动释放 5174 后启动；登录页角标应为 **正式版**。

`.env` 默认：

```env
VITE_API_BASE_URL=/api
VITE_DEV_AUTH_EMAIL=student1@test.nuanban.dev
VITE_RELEASE_CHANNEL=formal
VITE_DEMO_MOCK=false
```

Vite 会把 `/api` 代理到 `http://localhost:8090`。后端 `NUANBAN_FORMAL_AUTH=true`：**无** `000000` 万能码、**无** 验证码弹窗直显，须走运营发件箱。

万人压测测试数据（可选）：`npm run stress:seed-10k`，见 [STRESS_AND_FLOW_TEST.md](./STRESS_AND_FLOW_TEST.md)。

---

## 四、登录与三角色体验（正式流程）

本地 = **最新产品正式版**，按真实用户操作，不用演示捷径：

1. 输入 **11 位手机号**（可用自己的号，或 seed 账号 `13800000001`–`06`）
2. 点 **获取验证码** → 完成 **九宫格安全验证**
3. 打开 **短信发件箱** 查看 6 位码：登录页 **连点左上角「暖」字** → 运营演示（口令 `nuanban2026`）→ **更多** → **短信发件箱**
4. 输入验证码 → **登录 / 注册**

> 不可用 `000000` 跳过；不可用底部「游客账号」「动画演示」（正式版已隐藏）。  
> 新手机号会走注册流程；seed 账号见下表。

| 手机号 | 角色 | 登录后首页 |
|--------|------|------------|
| `13800000001` | 学生主流程 | 学生端首页，「待接单 N」、进行中订单（含语音测单） |
| `13800000003` | 学生 · 审核中 | 审核中页，无法接单/发现 |
| `13800000004` | 家属 | 家属端首页，「待支付订单」、绑定张奶奶 |
| `13800000005` | 老人 | 老人端首页，「找陪护」「一键求助」（张奶奶） |
| `13800000006` | 三角色 | 身份切换 |

### 学生端预期

1. 首页：**待接单 1**（seed 后有一条待接单）、底部 Tab（首页 / 发现 / 我的）
2. 点击 **发现**：附近老人列表，应看到 **张奶奶**（约 0km）、**李爷爷**（约 0.8km）
3. 切换 **地图** Tab：H5 使用 **OpenStreetMap** 瓦片 + 标注点（微信小程序仍用原生 `<map>`）；应看到蓝色「我的位置」与橙色合作老人标注
4. 点击老人卡片可进入订单详情页

### 家属端预期

1. 首页标题 **家属端**
2. 卡片 **待支付订单** → 模拟支付页（seed 后应有 1 条待支付订单）
3. 底部 Tab：首页 / 订单 / 我的

### 老人端预期

1. 大字号 **您好**，副标题「今日有人陪伴您」
2. 按钮 **找陪护** → 附近同学列表（seed 后应看到 **学生1**）
3. **一键求助** → Toast「已发送求助」

### 运营台预期（登录页连点「暖」→ 口令 `nuanban2026`）

底部 Tab：**概览 / 学生 / 机构 / 派单 / 资金 / 更多**

| Tab | 验收要点 |
|-----|----------|
| 概览 | KPI、撮合动态、待办 |
| 学生 | 学生档案列表、审核状态 |
| **机构** | 老人机构档案 PATCH、待补充横幅、学校合作入口 |
| 派单 | 待接单池 → 指定学生 |
| 资金 | 资金概览 |
| 更多 | **产品模块地图**、**安全中心**、短信发件箱、演示数据重置 |

机构档案维护在 **机构 Tab → 老人机构档案**（非 PocketBase Admin）。老人端「未填写（待机构补充）」字段由运营在此补齐。

### 语音通话（MVP · 2026-06-05 已通过 API 冒烟）

- **条件**：订单状态 `in_service`（seed 后学生 `13800000001` 有一条「生活陪护 · 张奶奶」进行中单）
- **入口**：学生/老人/家属 **订单详情** + **订单聊天页** 顶部「语音通话（隐私号）」按钮
- **行为**：弹窗显示隐私号与对方代号 → 确认后 `uni.makePhoneCall`（H5 可能改为复制号码）
- **聊天语音**：订单聊天页可发语音消息（`type=voice`），服务结束后通道关闭
- **非 MVP**：未接入微信 VoIP SDK，生产需云通信隐私号

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

# 产品冒烟（老人·家属·运营·语音）— 期望 29/29
node scripts/test-product-smoke.mjs

# 学生注册/审核流 — 期望 20/20
node scripts/test-student-audit-flow.mjs

# 三角色 dev-login（仅开发模式，正式鉴权下请用上列脚本）
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

### 冒烟脚本覆盖范围（2026-06-05）

| 脚本 | 通过 | 覆盖 |
|------|------|------|
| `test-product-smoke.mjs` | 29/29 | 老人资料/陪护/储值/统计；家属资料/储值/SOS；运营 KPI/学生/老人档案/机构/派单/资金；语音 GET/POST（学生·老人·家属）、聊天语音、404/400 边界 |
| `test-student-audit-flow.mjs` | 20/20 | 正式 captcha 登录、在审学生拦截、新号注册 pending、资料字段、¥0 余额 |

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
2. `./scripts/start-h5.sh` → 打开 http://localhost:5174/#/pages/common/login（角标 **正式版**）
3. 运行 `node scripts/test-product-smoke.mjs` 与 `node scripts/test-student-audit-flow.mjs`（均应为 0 失败）
4. H5 手动：`13800000001` → 发现 → 2 位老人；`13800000004` 待支付；`13800000005` 找陪护
5. 运营：登录页连点「暖」→ 机构 Tab → 老人档案；更多 → 模块地图 / 安全中心
6. 语音：`13800000001` → 进行中订单 → 语音通话按钮 + 订单聊天发语音
7. 可选：新手机号注册学生 → pending；`13800000003` 验证审核拦截

完整 **H5 逐点清单**（步骤 | 预期 | 通过□）见维护者在验收会话中提供的清单，或按上文各节「预期」逐 Tab 勾选。

---

## 九、推送代码（维护者）

```bash
git add -A
git status   # 勿提交 .env、pb_data、pb_data.bak
git commit -m "说明"
git push origin main
```
