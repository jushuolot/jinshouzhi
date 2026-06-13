# 暖伴勤工 · 压力与全流程测试

> 100 / 2000 虚拟用户并发、分角色完整流程、外部异常模拟。与 [ENV_PARITY.md](./ENV_PARITY.md) 对齐。

---

## 测试性评估（结论）

### 可完整测试（Mock / PocketBase 均支持）

| 能力 | 说明 |
|------|------|
| 手机登录 | 演示号 `13800000001`–`06` 验证码 **`000000`** |
| 注册 → 资料完善 | 学校白名单、卡通头像、核验照（dev 落盘 / Mock URL） |
| 学生审核队列 | 运营台通过/拒绝 `pending` 学生 |
| 老人找同学 / 同学找需求 | 附近列表、下单、接单、拒单 |
| 机构派单 | 待接单池 → 指定学生 |
| 服务流程 | 开始服务 → 签到 → 完成 → 待确认 → 完结 |
| 储值卡 / 演示微信支付 | 模拟扣款，非真实商户 |
| 提现申请与运营审批 | 状态机 pending → completed/rejected（**不打款**） |
| SOS 一键求助 | 触发、家属/学生 ack、运营台 SOS 队列 |
| 运营 KPI / 待办 | overview、资金、学生活动 |
| 并发读 | 待接单、附近老人、profile、overview |
| 并发写 | 同时接单、同时 SOS、同时提现申请（PB 单 SQLite 有上限） |

### 必须跳过（硬约束）

| 环节 | 原因 | 测试替代 |
|------|------|----------|
| **短信验证码** | 自建服务（无第三方） | 演示号 `000000`；其他号先图画验证再获取验证码 |
| **银行卡真实结算** | 无商户/打款 API | 提现仅测「申请 + 运营审批」状态机；channel=bank 记录不落账 |
| **微信 App 原生登录/支付** | H5 演示栈 | Mock 1.5s 模拟支付 / 储值卡 |

### 需 Stub / 模拟的外部依赖

| 依赖 | Stub 方式 |
|------|-----------|
| 地图 / 逆地理 | 客户端固定 lat/lng；hooks 用 Haversine，不测第三方地图 API |
| 地图 API 超时 | `scripts/stress/simulate-failures.mjs` + `GET /nuanban/debug/stress?delay=5000` |
| 网络超时 | fetch `AbortSignal.timeout` |
| PB 503 / 宕机 | 停容器或 `?fail=503` 注入 |
| 核验照上传失败 | 断网 / 超大 payload；dev 插件 413 |

**意见**：除短信与真实打款外，**业务闭环均可测**；GitHub Pages 仅 Mock+localStorage，100/2000 压测请在 **本地 PB** 或 **阿里云** 跑 Node 脚本。

---

## 角色 × 流程 × 测试模式矩阵

| 角色 | 核心流程 | Mock 本地 | PB 本地 | 并发压测 |
|------|----------|-----------|---------|----------|
| **学生** | 登录→资料→待接单→接单→服务→完成→收入→提现申请 | `flow-role-student.mjs`（浏览器手测） | 同左脚本 | 100/2000 读 profile+pending；写 accept/withdrawal |
| **家属** | 登录→钱包→代付→确认完成→SOS ack | `flow-role-family.mjs` | 同左 | 并发 pay + confirm |
| **老人** | 登录→附近同学→下单→SOS | `flow-role-elder.mjs` | 同左 | 并发 nearby + sos |
| **机构派单** | 待接单列表→dispatch | ops / org API | 同左 | 并发 dispatch（竞态） |
| **运营** | overview→学生审核→提现审批→SOS 队列 | `flow-role-ops.mjs` | 同左 | 并发 overview + students |

### 流程脚本差异（刻意不同路径）

- **学生**：`phone-login 01` → profile → pending orders → **accept 首单** → active order → withdrawal GET
- **家属**：`phone-login 04` → wallet → stats → **family pay**（若有 pending_payment）
- **老人**：`phone-login 05` → caregivers nearby → **POST sos** → wallet
- **运营**：无登录 → platform/overview → students → funds → dispatchable（口令门仅 H5 UI，API 演示栈不拦）

---

## 万人真实数据压测（10k）

### 数据构成（PocketBase 真实落库）

| 指标 | 数量 |
|------|------|
| 独立账号（手机 13910000000–09999） | 10,000 |
| 学生（60%，含 10% pending 待审） | 6,000 |
| 老人 + 档案 | 2,000 |
| 家属 + 绑定 | 2,000 |
| 待接单订单 | ~400 |

### 命令

```bash
./scripts/seed-demo.sh                    # 先写入服务项目
npm run stress:seed-10k                   # 写入万人真实数据（~17min）
npm run stress:10000                      # 万人并发读压测
npm run stress:10000-full                 # 种子 + 冒烟 + 压测 一键

# 校验落库
curl "http://127.0.0.1:8090/api/nuanban/platform/load-test/stats?key=nuanban_load_seed"
```

报告：`dev-data/load-test/manifest-10k.json`、`report-10k.json`（本地生成，不入库）

### 通过标准（实测参考）

| 指标 | 万人 |
|------|------|
| 成功率 | ≥ 97% |
| p95 延迟 | < 3s（SQLite 单节点） |
| 种子校验 | loadTestUsers = 10000 |

---

## 100 人 / 2000 人场景

### 假设

- 「100 人 / 2000 人」= **100 / 2000 个虚拟并发会话**，循环使用 6 个演示号 + 合成手机号（只读压测）。
- 真实 2000 **独立账号**需扩展 seed；当前脚本以 **API QPS 与竞态** 为主。

### 100 用户（`stress-100.mjs`）

| 阶段 | 比例 | 操作 |
|------|------|------|
| 登录 | 100% | phone-login 循环 01–06 |
| 读 profile / 列表 | 60% | student profile + pending；family stats |
| 写操作 | 25% | elder sos（限流）；student withdrawal GET |
| 运营读 | 15% | platform/overview + students |

**并发点**：30 并发 worker，~3s 内完成。

### 2000 用户（`stress-2000.mjs`）

| 阶段 | 比例 | 操作 |
|------|------|------|
| 纯读 | 70% | elders/nearby、caregivers/nearby、overview |
| 登录+读 | 20% | phone-login + profile |
| 写 | 10% | 并发 accept（同一 pending 单竞态）、并发 sos |

**并发点**：80 worker，预期 PB SQLite 在写密集时 p95 升高；记录 fail 率 & p95。

---

## 外部失败用例

| 场景 | 模拟方法 |
|------|----------|
| 网络超时 | `fetch` + `AbortSignal.timeout(500)` |
| 慢响应 | `GET /api/nuanban/debug/stress?delay=3000` |
| HTTP 500/503 | `GET /api/nuanban/debug/stress?fail=500` |
| PB 不可用 | 停止 docker / 错误端口 |
| 错误角色 | 带 `X-Active-Role: elder` 调 student API → 403 |
| 地图失败 | 请求 nearby 不传 lat/lng → 400（客户端应拦截） |

运行：`node scripts/stress/simulate-failures.mjs`

---

## 如何运行

### 前置

```bash
# PocketBase 模式（推荐压测）
./scripts/dev-test.sh          # 启动 PB + seed
export NUANBAN_API=http://127.0.0.1:8090

# 或 GitHub Mock 模式：仅 flow 手测 / 浏览器；Node 脚本需 PB
```

### 命令

```bash
# 分角色完整流程（冒烟）
node scripts/stress/flow-role-student.mjs
node scripts/stress/flow-role-family.mjs
node scripts/stress/flow-role-elder.mjs
node scripts/stress/flow-role-ops.mjs

# 压力（需 PB）
node scripts/stress/stress-100.mjs
node scripts/stress/stress-2000.mjs

# 异常模拟
node scripts/stress/simulate-failures.mjs

# 一键（自动检测 PB）
./scripts/run-stress.sh smoke    # 4 角色 flow
./scripts/run-stress.sh 100
./scripts/run-stress.sh 2000
./scripts/run-stress.sh failures
```

### 阿里云

```bash
ssh 到 ECS
export NUANBAN_API=https://你的域名   # 或 http://127.0.0.1:8090 在机内
cd nuanban_github
node scripts/stress/flow-role-student.mjs
node scripts/stress/stress-100.mjs
```

GitHub Pages **不能**跑 Node 压测（无 API）；仅作 Mock 手测备份。

---

## 通过标准（建议）

| 指标 | 100 用户 | 2000 用户 |
|------|----------|-----------|
| 成功率 | ≥ 98% | ≥ 95%（SQLite 写密集） |
| p95 延迟 | < 2s | < 5s |
| 竞态 | accept 仅一人成功 | 同左 |
| 流程脚本 | 4 角色 exit 0 | — |

---

## 相关脚本

- `scripts/check-api-parity.mjs` — mock/hooks 路径对齐
- `scripts/pb-smoke-student.sh` — 学生 API 冒烟
- `scripts/dev-test.sh` — 本地 PB 联调
