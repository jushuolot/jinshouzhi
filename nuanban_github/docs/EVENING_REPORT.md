# 暖伴勤工 · 晚间验收报告

**日期**：2026-06-12  
**Git 分支**：`main`（请以 `git log -1` 为准）

---

## 一、今日已完成能力（摘要）

| 模块 | 状态 |
|------|------|
| 订单密聊 · 文字 + **语音**（按住说话） | ✅ |
| **自建短信** + **9 宫格安全验证**（无第三方 SMS） | ✅ |
| 演示号登录 **`000000`** | ✅ |
| 运营 **短信发件箱**（备案期人工下发） | ✅ |
| 本地 **parity**（PocketBase 测试数据，非 Mock） | ✅ |
| H5 **OpenStreetMap** 附近老人地图 | ✅ |
| **性别** 全链路 | ✅ |
| 老人端 **资料/支付可延后**（机构字段只读） | ✅ |
| `elders` **schema 补全**（健康/紧急联系人等） | ✅ |

---

## 二、自动化检查结果（本机）

| 检查项 | 结果 |
|--------|------|
| `npm run build:h5` | ✅ 通过 |
| `npm run check:api` | ✅ 71 条 `/nuanban/*` mock + hooks 对齐 |
| `npm run check:routes` | ✅ 63 条页面路由 |
| `scripts/pb-smoke-student.sh` | 需本地 Docker PocketBase 运行后执行 |

---

## 三、查漏补缺与修复（今日）

1. **文档**：全文「验证码留空」→ **`000000`** + `docs/SMS_CAPTCHA.md`
2. **老人 schema**：`pb_schema.json` 补 age/district/health/emergency 等；seed 写入张奶奶/李爷爷
3. **老人 GET 档案**：去掉假默认值；空字段真实返回
4. **老人 onboarding**：不强制填资料/支付；付款时再引导配置扫呗
5. **登录 UX**：演示号 `13800000001`–`06` 显示「点此处填入 000000」
6. **我的 · 老人档案**：空爱好/偏好显示「未填写」
7. **npm scripts**：新增 `check:api`、`check:routes`

---

## 四、晚上回来建议验收（约 15 分钟）

### 本地

```bash
cd nuanban_github
./scripts/dev-test.sh          # 终端 1
./scripts/start-h5.sh          # 终端 2
```

打开：http://localhost:5174/#/pages/common/login

| # | 账号 | 验证码 | 验收点 |
|---|------|--------|--------|
| 1 | `13800000001` | `000000` 或点橙色快捷填码 | 学生首页 · 发现 · 地图有街道 |
| 2 | `13800000005` | `000000` | **直接进老人首页**（不强制填资料） |
| 3 | 老人 | — | 我的 → 机构字段灰色「未填写（机构维护）」 |
| 4 | 老人 | — | 服务中订单 → 密聊 → **按住说话** |
| 5 | 新手机号 | 图画验证 → 获取验证码 | 本地 dev 会弹窗显示 6 位码 |

### 阿里云

Workbench 执行（拉最新代码 + 重建）：

```bash
cd /opt/jinshouzhi/nuanban_github && ./scripts/release-prod.sh
```

验收：http://101.200.128.82/#/pages/common/login  
演示号 + **`000000`**；强刷 `Cmd+Shift+R`。

运营查验证码：**运营台 → 更多 → 短信发件箱**。

---

## 五、已知限制 / 剩余风险

| 项 | 说明 |
|----|------|
| 订单聊天消息 | 存 **内存**，PocketBase 重启后清空（设计如此，零成本） |
| 非演示号生产验证码 | 无真实 SMS，需运营发件箱人工告知 |
| `https://nuanban.cc` | 备案/DNS 未通，暂用 IP |
| 机构维护字段 | 需在 PB/运营侧写入 `elders` 记录后老人才可见 |
| 压测 | `npm run stress:seed-10k` 可选，与演示 seed 独立 |

---

## 六、相关文档

- [SMS_CAPTCHA.md](./SMS_CAPTCHA.md) — 登录验证流程
- [ORDER_CONTACT.md](./ORDER_CONTACT.md) — 订单密聊 + 语音
- [LOCAL_TEST.md](./LOCAL_TEST.md) — 本地 parity
- [ALIYUN_DEPLOY.md](./ALIYUN_DEPLOY.md) — 服务器部署

---

*本报告由后台审计自动生成/更新，随 `main` 推送。*
