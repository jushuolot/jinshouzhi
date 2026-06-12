# 暖伴勤工 · 测试版完整说明

GitHub Pages 上的 **测试备份**：浏览器 **Mock**（`demo-mock.ts`，无 PocketBase 硬约束）。  
**本地测试机**与 **阿里云** 使用 PocketBase **测试数据 / 生产数据**，`VITE_DEMO_MOCK=false`。勿混淆 Mock 与测试数据。见 [ENV_PARITY.md](./ENV_PARITY.md)。

---

## 产品卓越（便捷 · 安全 · 清晰 · 美观）

| 入口 | 链接 |
|------|------|
| **模块地图** | `#/pages/common/module-map` |
| **安全中心** | `#/pages/common/security` |
| **深度验收向导** | `#/pages/common/scenario-guide` |

详见 [PRODUCT_EXCELLENCE.md](./PRODUCT_EXCELLENCE.md)。

---

## 一、测试版入口（主链接）

| 说明 | 链接 |
|------|------|
| **测试入口（动画→游客）** | https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch |
| 站点根路径（自动跳转登录） | https://jushuolot.github.io/jinshouzhi/nuanban/ |

**如何确认是测试版**

- 登录页标题下方显示 **「测试版」** 角标
- 数据在浏览器内 **Mock 模拟**（GitHub 硬约束；与 PocketBase 逻辑已对齐，见 ENV_PARITY.md）
- 演示号验证码 **`000000`**；其他号需图画验证后获取 6 位码

**如何确认是正式版（勿混淆）**

- 地址为 `http://101.200.128.82` 或 `https://nuanban.cc`
- 登录页显示 **「正式版」** 角标
- 需使用演示号 `13800000001`–`06`，连接真实 PocketBase

---

## 二、测试版功能链接速查

将下列链接中的域名替换为测试版根路径即可分享验收。

**基础路径：** `https://jushuolot.github.io/jinshouzhi/nuanban`

### 公共页

| 页面 | 路径 |
|------|------|
| 启动（未登录→动画） | `#/pages/common/launch` |
| 用户手册（登录前必读） | `#/pages/common/user-manual` |
| 登录 | `#/pages/common/login` |
| 动画演示（22 秒五幕） | `#/pages/common/demo-tour` |
| 运营模式（口令 + KPI + 派单） | `#/pages/common/ops-gate`（登录页点「暖」图标亦可） |
| 机构派单 | `#/pages/common/org-dispatch` |
| 学校合作（只读） | `#/pages/common/school-coop` |
| 演示链接分享 | `#/pages/common/share-demo` |
| 用户协议 | `#/pages/common/agreement` |
| 安全中心 | `#/pages/common/security` |
| 深度验收向导 | `#/pages/common/scenario-guide` |
| 身份选择 | `#/pages/common/role-select` |
| 注册新角色 | `#/pages/common/register` |

### 深链（适合外链 / 二维码）

| 说明 | 完整链接 |
|------|----------|
| 直达动画演示 | https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch?tour=1 |
| 直达分享页 | https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch?share=1 |
| 动画结束预填学生号 | https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login?from=tour |

### 三端首页（未登录可预览 · 操作需登录）

| 角色 | 路径 |
|------|------|
| 学生首页 | `#/package-student/home` |
| 学生待接单 | `#/package-student/order/pending` |
| 学生发现 | `#/package-student/discover/list` |
| 学生我的 | `#/package-student/profile` |
| 家属首页 | `#/package-family/home` |
| 老人首页 | `#/package-elder/home` |
| 老人找陪护 | `#/package-elder/caregivers/list` |

---

## 三、演示账号

登录页点 **「虚拟手机登录 · 点按选择测试号」** 或底部 **「测试账号」** 一键填入。

| 手机号 | 角色 | 验收重点 |
|--------|------|----------|
| `13800000001` | 学生 · 林同学 | 接单、签到、完成、收入、推荐、编辑资料、换头像 |
| `13800000002` | 学生 · 周同学 | 发现页「学校合作」筛选 |
| `13800000003` | 学生 · 待审 | 审核中页，无法接单 |
| `13800000004` | 家属 | 代付、外出审批、SOS、服务包 |
| `13800000005` | 老人 | 找陪护、预约、绑定码、一键求助 |
| `13800000006` | 多角色 | 登录后切换学生 / 家属 / 老人 |

验证码：演示号填 **`000000`**；新号须先「获取验证码」（含安全图画点选）。

---

## 四、推荐验收路径

### 路径 A · 5 分钟快测

1. 打开 [启动页](https://jushuolot.github.io/jinshouzhi/nuanban/) → 动画演示结束自动进入老人首页预览
2. 点 **登录/注册** → 阅读 [用户手册](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/user-manual) 并确认
3. 选 `13800000001` → 登录 → 若首次引导则完善资料含扫呗收款 → 首页看待接单
3. 底部 **接单** → 接受一单 → **服务中** → 签到 → 完成
4. **我的** → 收入明细 / 编辑资料

### 路径 B · 三角色全覆盖

| 顺序 | 手机号 | 操作 |
|------|--------|------|
| 1 | 13800000005 | 老人：找陪护 → 预约 |
| 2 | 13800000004 | 家属：待支付 → 模拟支付 → SOS 确认 |
| 3 | 13800000001 | 学生：待接单 → 完成服务 → 发现附近老人 |

### 路径 C · 运营与演示

1. [动画演示](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/demo-tour) 看完五幕
2. 登录页点 **「暖」** 或 **更多 → 运营模式**（口令默认 `暖伴2026`）→ KPI → **机构派单**
3. 登录页 **更多 → 分享演示链接** → 复制给验收人

### 路径 D · 首次资料引导

1. 登录 `13800000006` → 选择尚未完善资料的角色
2. 应自动跳转 **编辑资料** 页（带 onboarding 提示）
3. 填写基本资料并绑定 **扫呗** 付款/收款账户（演示可填任意商户号）
4. 保存后进入对应角色首页；同角色再次登录不再跳转

### 路径 E · 访客预览

1. 未登录打开站点 → 动画演示 → 自动进入老人首页 **预览模式**
2. 可切换老人/家属/学生首页浏览界面；点击下单等操作提示登录
3. 底部 Tab 非首页项同样需登录

---

## 五、测试版技术说明

| 项 | 测试备份（GitHub Pages） | 正式版（阿里云） |
|----|--------------------------|------------------|
| 构建渠道 | `VITE_RELEASE_CHANNEL=test` | `VITE_RELEASE_CHANNEL=public` |
| 数据 | `VITE_DEMO_MOCK=true`，浏览器 Mock | 真实 PocketBase API |
| 发布命令 | `./scripts/release-test.sh` | `./scripts/release-prod.sh` |
| 业务规则 | demo-mock 镜像 hooks | nuanban.pb.js |
| 更新延迟 | push 后约 2～5 分钟（Actions） | 执行 release-prod 后立即 |

### Mock 富数据（种子订单）

首次打开或清除站点数据后，内置订单池规模如下（`demo-rich-data.ts` → `buildRichOrders`）：

| 状态 | 数量 | 说明 |
|------|------|------|
| `pending_accept` | 15 | 学生待接单池（含 `order-pending-accept` 等固定 id） |
| `pending_payment` | 6 | 5 单通用待支付 + 1 单张奶奶「我的服务」演示 |
| `outdoor_pending` | 2 | 外出待家属审批 |
| `pending_service` / `in_service` | 2 + 2 | 学生进行中任务 |
| `pending_confirm` | 2 | 待家属/老人确认完成 |
| `completed` | 12 | 学生收入与结算压力数据 |
| `cancelled` | 1 | 已取消样例 |

储值卡种子余额：家属 **¥500**、老人 **¥300**（`demo-wallet.ts`）。  
老人首页 **快捷服务** 区展示储值卡余额，跳转 `#/package-elder/wallet/index`。  
结算月报种子 **4** 条（`SETTLEMENTS`：2025-03 至 06，含当月待结）。

### 服务包

- **API**：`GET /nuanban/family/packages` 返回 3 档套餐
- **入口**：家属首页 → 服务包购买；`#/package-family/package/buy`
- **流程**：模拟购买 → 待支付订单 → 储值卡或微信演示支付

### 刷新不丢状态

以下数据写入浏览器 `localStorage`，**强刷或关闭标签后仍保留**（与种子数据独立）：

| 键 | 模块 | 内容 |
|----|------|------|
| `nuanban_demo_state_v4` | `demo-mock-state.ts` | 订单、SOS、外出审批、服务记录、结算、**撮合动态** |
| `nuanban_scenario_v1` | 深度验收向导 | 9 步完成进度 |
| `nuanban_wallet_v1` | `demo-wallet.ts` | 储值卡余额与流水 |
| `nuanban_student_wallet_v1` | `demo-student-wallet.ts` | 学生提现记录 |

验收接单、支付、SOS 确认后刷新页面，应看到变更仍在。若要恢复种子数据：

- **运营演示** → 底部 **「重置演示数据」**（清除 `nuanban_demo_state_v4` / `nuanban_wallet_v1` / `nuanban_student_wallet_v1` / `nuanban_scenario_v1` 并刷新）
- 或清除站点本地存储 / 使用无痕窗口

家属首页待办区展示 **储值卡** 卡片（余额来自 `fetchFamilyWallet`）。多角色账号 `13800000006` 切换家属后绑定张/李/王三位老人（与 `13800000004` 一致）。

地图在部分 H5 环境可能空白，**列表模式可完整演示**主流程。  
电脑浏览器打开时，顶部可切换 **iPhone / 华为 X6** 预览框；手机打开为全屏。

---

## 五（补）、支付演示

测试版支持两条付款路径，详见 [PAYMENT.md](./PAYMENT.md)。

| 方式 | 入口 | 行为 |
|------|------|------|
| **储值卡** | 家属待支付 → 选「储值卡」 | 从本地余额扣减，不足提示充值 |
| **微信支付（演示）** | 同上 → 选「微信支付（演示）」 | 1.5s 模拟 + 直接标记已付，无真实扣款 |

学生首页在有可提现余额时显示 **提现** 横幅（`13800000001` 验收）；快捷入口含 **服务日志**。

家属首页待办含 **服务记录**（绑定老人的已完成服务归档，种子约 12 条）；订单详情在已派单时显示 **陪护同学**。老人端同样有 **服务记录** 页（`#/package-elder/service/log`）。

学生接单页对外出陪同订单显示 **审批提示**；机构派单列表标注「外出陪同」；家属订单列表未付订单显示 **待付** 角标。

推荐用 `13800000004` 验收：待支付 → 储值卡或微信演示 → 学生端完成服务 → 家属确认 → 服务记录查看。

---

## 五（深）、深度验收

| 能力 | 入口 | 说明 |
|------|------|------|
| **深度验收向导** | 登录页 → 更多 → 深度验收向导 | 9 步三角色闭环，进度经 `secure-storage` 混淆存 `nuanban_scenario_v1`；全部完成显示庆祝横幅 |
| **撮合动态** | 运营演示 → 撮合动态 | 接单/支付/SOS 等事件时间线（`demo-activity.ts`），相对时间展示 |
| **注入外出演示单** | 运营演示 → 注入外出演示单 | `POST /nuanban/platform/seed-scenario` |
| **家属最新动态** | 家属首页底部 | 展示最近 2 条平台动态 |

**推荐深度路径**：向导步骤 1–9 → 运营页注入外出单 → `13800000004` 外出审批 → 动态区应出现新事件。

状态版本 **v4**：从 v3 升级后首次打开会恢复种子数据（键名 `nuanban_demo_state_v4`）。

---

## 六、维护者：发布与检查测试版

```bash
# 1. 提交代码后发布测试版
./scripts/release-test.sh

# 2. 查看 GitHub Actions 是否成功
# https://github.com/jushuolot/jinshouzhi/actions

# 3. 对比测试版与正式版版本
./scripts/release-status.sh

# 4. 测试版验收通过后发布正式版
./scripts/release-prod.sh
```

本地开发（连真实 API，非 Mock）见 [LOCAL_TEST.md](./LOCAL_TEST.md)。

---

## 七、常见问题

| 现象 | 处理 |
|------|------|
| 打开 404 | 确认 GitHub Pages 已开启，Branch=`main`，Folder=`/docs` |
| 页面是旧版 | **Cmd+Shift+R** 强刷；等 Actions 构建完成 |
| 提示后端未启动 | 当前页不是测试版，或缓存了旧包；确认 URL 为 `github.io` 且见「测试版」角标 |
| 登录后空白 | 强刷；换 Chrome / 微信内置浏览器重试 |
| 想测真实 API | 用本地 `dev-test.sh` + `npm run dev:h5`，或正式版链接 |

---

## 八、相关文档

| 文档 | 内容 |
|------|------|
| [RELEASE.md](./RELEASE.md) | 测试版 / 正式版发布规则 |
| [DEMO_LINK.md](./DEMO_LINK.md) | 客人演示速查（链到本文） |
| [GITHUB_DEMO.md](./GITHUB_DEMO.md) | GitHub Pages 首次搭建 |
| [PERFECT.md](./PERFECT.md) | 零成本演示验收清单 |
| [PAYMENT.md](./PAYMENT.md) | 支付三阶段演进（Mock → 储值卡 → 微信） |
| [ALIYUN_DEPLOY.md](./ALIYUN_DEPLOY.md) | 正式版服务器部署 |
