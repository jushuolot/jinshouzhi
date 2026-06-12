# 暖伴勤工 · 晚间 Gap 审计报告

**日期**：2026-06-12  
**范围**：`nuanban_github/` 全栈（miniapp + demo-mock + pb_hooks + scripts + docs）

---

## 1. 审计项与结果

| 类别 | 检查内容 | 结果 |
|------|----------|------|
| **构建** | `npm run build:h5`（packages/miniapp） | ✅ PASS |
| **路由** | `scripts/check-routes.mjs`（63 路径） | ✅ 无重复路由 |
| **API 对齐** | `scripts/check-api-parity.mjs`（71 nuanban 路径） | ✅ mock ↔ hooks 一致 |
| **富数据** | `scripts/check-data.mjs` | ✅ pending_accept / elders / packages / settlements |
| **公网冒烟** | `scripts/smoke-demo.sh` → GitHub Pages HTTP 200 | ✅ PASS |
| **PB 冒烟** | `scripts/pb-smoke-student.sh` | ⏭ 跳过（本机无 Docker/PocketBase） |
| **坏模式扫描** | `验证码留空` / empty-code login / TODO·FIXME | ✅ 无「留空登录」；仅 1 处 TODO（elder.service 距离过滤，非阻塞） |
| **Auth/SMS** | login.vue · demo-mock · nuanban.pb.js phone-login · stress/lib.mjs | ✅ 统一 6 位 + 演示号 `000000` |
| **游客登录** | guest-role-pick → enterGuestBrowse → 三端首页预览 | ✅ Mock 拦截 + guest-preview-data |
| **老人 UX** | profile-onboarding 跳过老人；elders schema ↔ GET/PATCH；seed applyElderDemoFields | ✅ 对齐 |
| **订单密聊语音** | order-chat.vue · nuanban_lib orderMessagePushVoice · demo-mock voice | ✅ 三端一致 |
| **运维部署** | release-prod.sh · ops-sms · sms-outbox API · docs 路径 | ✅ 脚本与路由齐全 |
| **nuanban_lib 导出** | orderChat* / orderMessage* 等 pb 引用 | ✅ module.exports 完整 |
| **ProfilePage selfVal** | 紧急联系人段作用域 | ✅ 已在 elder 块内定义并使用，非 bug |

---

## 2. 发现问题与修复

| 问题 | 严重度 | 处理 |
|------|--------|------|
| 老人资料页空 hobbies / servicePreferences 无占位 | 低 | ProfilePage 补「未填写」行与空 tags 处理 |
| 老人期望时段为空时无提示 | 低 | ProfilePage 服务偏好段补「期望时段 · 未填写」 |
| 演示号需手输 000000，晚间验收易漏 | 低 | login.vue 增加「演示号免短信」一键填入 |
| roleLabel map 中 student 误标为「家属」（死代码） | 极低 | 更正为「学生」 |
| 根 package.json 缺快捷校验脚本 | 低 | 新增 `check:api` / `check:routes` |

**未修复 / 已确认非问题**：

- `ProfilePage selfVal`：审查后确认在 `if (elder)` 块内声明，紧急联系人三行均在同一 return 数组中，作用域正确。
- `vue-tsc`（npx 临时 3.x）：对 spread 三元报 TS1137；`uni build` 正常，以 H5 构建为准。
- `packages/api/elder/elder.service.ts` TODO：二期距离过滤，不影响演示。

**提交 SHA**：

- `230219b` — chore(nuanban): 晚间验收报告与登录/档案 UX 补漏（ProfilePage 空字段、login 演示码一键填入、check 脚本）

---

## 3. 剩余风险

1. **本机未跑 PB 冒烟**：Docker 未启动，hooks 运行时行为依赖阿里云/本地 `dev-test.sh` 人工复验。
2. **语音密聊 H5**：依赖浏览器 `MediaRecorder` / 录音 API，微信内置浏览器与部分 iOS 需实机点测。
3. **GitHub Pages 延迟**：push 后 Actions 约 2 分钟；晚间测试请强刷（Cmd+Shift+R）。
4. **阿里云未在本轮部署**：仅代码审计 + GitHub 备份路径验证；正式环境需单独 `release-prod.sh`。

---

## 4. 晚间手工验收清单（建议 15 分钟）

### 登录 / 公共

- [ ] 打开 [GitHub Pages 登录页](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login)，角标「测试版」
- [ ] `13800000001` → 点「演示号免短信」或手输 `000000` → 学生首页
- [ ] 登录页「游客账号」→ 选老人/家属/学生 → 首页有游客横幅、可浏览不可落库
- [ ] 运营演示 → 更多 → **短信发件箱** 可打开

### 老人端（13800000005）

- [ ] 登录后**不**强制资料引导，直达首页
- [ ] 我的 → 档案 hobbies/服务偏好/期望时段空时有「未填写」
- [ ] 编辑资料 →「先逛逛，稍后完善」可跳过

### 订单密聊

- [ ] 任一端进行中订单 → 订单密聊 → 发文字
- [ ] 按住说话录音 → 列表出现语音条 → 点击播放

### 三端短信一致性（阿里云 parity 时）

- [ ] `dev-test.sh` + `start-h5.sh` 下同样演示号 + `000000` 可登录

---

## 5. 阿里云正式发布（一行命令）

在阿里云 Workbench 或已配置 SSH 的本地执行：

```bash
cd /opt/jinshouzhi/nuanban_github && ./scripts/release-prod.sh
```

本地经 SSH 触发（需 `config/demo.env` 中 `NUANBAN_SSH` + `NUANBAN_REMOTE_DIR`）：

```bash
./scripts/release-prod.sh
```

部署后强刷 H5，登录页角标应为「发布版」。

---

*本报告由 Cursor Agent 晚间全量 gap 审计生成。*
