# 暖伴勤工 · 正式版推进准备清单

三环境分工：

| 环境 | 角色 | 角标 | 数据 |
|------|------|------|------|
| **本地** | **最新产品验证** | **正式版** | PocketBase 测试数据 + `NUANBAN_FORMAL_AUTH=true` |
| **GitHub Pages** | **发布版** | **发布版** | 真实 API（`VITE_RELEASE_CHANNEL=release`，与阿里云同库） |
| **阿里云** | **发布稳定版** | **发布稳定版** | PocketBase 生产数据（`VITE_RELEASE_CHANNEL=stable`） |

---

## 一、必须先定的外部信息（阻塞上线）

### 1. 域名与证书

| 项 | 用途 | 状态栏 |
|----|------|--------|
| `nuanban.cc` 备案号 | 对外发布合法访问 | ☐ |
| DNS A 记录 → 阿里云 IP | 正式域名解析 | ☐ |
| HTTPS 证书 | Caddy 自动或手动上传 | ☐ |
| GitHub Pages 正式 API 域名 | 如 `api-formal.nuanban.cc` 或 Render 子域 | ☐ |

### 2. 后端 API（PocketBase）

| 项 | 说明 | 状态栏 |
|----|------|--------|
| **正式制作 API 地址** | 供 GitHub Actions 构建 `VITE_API_BASE_URL` | ☐ |
| **对外发布 API** | 阿里云同域 `/api` 反代 | ☐ |
| `PB_ENCRYPTION_KEY` | 生产环境加密密钥（两环境是否共用需定） | ☐ |
| 超级管理员账号 | `/_/` 后台 | ☐ |
| 数据库备份策略 | `pb_data` 定时备份到 OSS | ☐ |

> GitHub 仓库 **Settings → Variables** 新增：`NUANBAN_FORMAL_API_URL`（例 `https://api.xxx.com/api`）

### 3. 短信与登录

| 项 | 说明 | 状态栏 |
|----|------|--------|
| 短信服务商 | 阿里云短信 / 腾讯云 SMS | ☐ |
| 签名与模板 ID | 「暖伴勤工」验证码模板 | ☐ |
| 演示号策略 | `13800000001`–`06` 是否保留（仅 PB hooks） | ☐ |

### 4. 微信生态（可选分期）

| 项 | 说明 | 状态栏 |
|----|------|--------|
| 微信小程序 AppID | `mp-weixin` 发布 | ☐ |
| 微信开放平台 | 若需 H5 关联登录 | ☐ |
| 微信支付商户号 | 家属代付、储值 | ☐ |
| 学生提现 | 企业付款到零钱 / 银行卡通道 | ☐ |

### 5. 法务与主体

| 项 | 说明 | 状态栏 |
|----|------|--------|
| 运营主体全称 | 用户协议、隐私政策落款 | ☐ |
| 用户协议 / 隐私政策定稿 | 律师审核版 | ☐ |
| ICP 备案展示文案 | 登录页/关于页页脚 | ☐ |
| 客服电话 / 邮箱 | `privacy@nuanban.cc` 等 | ☐ |

### 6. 运营与安全

| 项 | 说明 | 状态栏 |
|----|------|--------|
| 运营模式口令 | `VITE_OPS_PASSPHRASE` / 生产独立口令 | ☐ |
| 资金审批流程 | 提现人工审核责任人 | ☐ |
| PocketBase 运营账号权限 | 非超管日常操作 | ☐ |

---

## 二、GitHub 正式版 CI 配置

在仓库配置（**Settings → Secrets and variables → Actions → Variables**）：

```text
NUANBAN_FORMAL_API_URL=https://你的正式制作API/api
GITHUB_REPO=jinshouzhi
```

构建变量（已在 workflow 中）：

```text
VITE_RELEASE_CHANNEL=release
VITE_API_BASE_URL=${NUANBAN_FORMAL_API_URL}   # 默认 http://101.200.128.82/api
# 不设置 VITE_DEMO_MOCK — 登录走真实 API，游客走前端 Mock
```

> **HTTPS**：GitHub Pages 为 HTTPS；API 为 HTTP 时浏览器可能 mixed-content 拦截。备案后将 `NUANBAN_FORMAL_API_URL` 改为 `https://nuanban.cc/api`。

---

## 三、本地测试机（开发）

```bash
# 1. 启动后端 + 写入测试数据
./scripts/dev-test.sh

# 2. 前端（新开终端，自动 parity .env）
./scripts/start-h5.sh
```

本地默认 **PocketBase 测试数据**，与阿里云同逻辑；浏览器 Mock 仅**游客浏览**或显式 `VITE_DEMO_MOCK=true`。

---

## 四、发布命令对照

| 目标 | 命令 | 结果 |
|------|------|------|
| 推 **GitHub 发布版** | `./scripts/release-formal.sh` | Pages 角标「发布版」 |
| 推 **阿里云稳定版** | `./scripts/release-prod.sh` | 角标「发布稳定版」 |
| 看版本是否一致 | `./scripts/release-status.sh` | 对比 SHA |

原则：**本地测通 → GitHub 正式制作验收 → 阿里云对外发布**。

---

## 五、演示数据边界（已落地规则）

- `isGuestBrowse() === true` → 前端 Mock，不写真实库
- 已登录用户（正式/发布）→ 一律 `request()` 走 PocketBase
- 本地 `VITE_DEMO_MOCK=false`（`dev-test.sh` / `start-h5.sh` 强制）→ PocketBase 测试数据
- GitHub Pages 不设 `VITE_DEMO_MOCK` → 登录用户走远程 PocketBase；游客仍 Mock

---

## 六、建议推进顺序

1. 定 **正式制作 API** 地址并写入 GitHub Variables  
2. 本地 Docker PB + 登录/注册/三端主流程跑通  
3. 推 GitHub 正式版，游客 + 真实账号分别验收  
4. 补齐短信 / 支付 / 法务  
5. 备案与域名就绪后 `release-prod.sh` 对外发布  

---

## 七、待产品继续进化（正式版口径）

- [ ] 短信真实发送与倒计时
- [ ] 登录态刷新与多端踢下线策略
- [ ] PC 宽屏布局（模块地图、运营台表格）
- [ ] 资金流水对接真实 PB 集合
- [ ] CSP / HTTPS 强制与安全头（Caddy）
- [ ] 小程序提审素材（类目、隐私弹窗）

相关文档：[RELEASE.md](./RELEASE.md) · [LOCAL_TEST.md](./LOCAL_TEST.md) · [ALIYUN_ENV.md](./ALIYUN_ENV.md)
