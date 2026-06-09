# 平行宇宙 · 每日真人进化手册

> **观测者**：造物主（用户）上帝视角，每晚上线验收。  
> **世界规则**：摸金天团活在「古蜀秘档」平行宇宙里——**每一天都是新的一圈循环，每一天都不一样**，像真人过日子，不是换皮。

供 Cursor 定时自动化（或人工触发）在白天后台执行；用户晚间以旁观者身份看这个世界又演进了什么。

---

## 世界观（Agent 必须理解）

1. **平行宇宙**：每次 `generation +1` = 这个宇宙里的 **又一天**。昨天发生的事可以延续、可以微调、可以「今天大家 mood 不同」——但不必和旧宇宙逐字相同。
2. **真人感**：胡探、王墩、杨雪、金牙刘、陈礼会累、会饿、会拌嘴、会怀旧、会开玩笑。旁白可以记天气、营地伙食、谁昨晚没睡好。消消乐闯关是「下坑干活」，剧情是「收工后的人话」。
3. **可以改剧情**：`story.js`、`map-narrative.js`、`expedition-data.js` **允许且鼓励**按「今日」改写对白、发现台词、策划/集合片段。保持三星堆 / 摸金 / 考古大框架即可，细节每天刷新。
4. **上帝视角**：不在游戏里打破第四面墙喊「用户来了」。进化结果体现在：今晚打开游戏，会感觉到 **「他们又活了一天」**。

---

## 仓库与发布

| 项 | 值 |
|----|-----|
| monorepo | `jushuolot/jinshouzhi` · 分支 `main` |
| 游戏 Pages | `match3-game/` → subtree 推 `game` 远端 `main` |
| 线上 | https://jushuolot.github.io/game/ |

```bash
git push origin main
git subtree split --prefix=match3-game -b match3-pages-deploy
git push game match3-pages-deploy:main --force
```

---

## 不可改动

- 不向**玩家**展示广告收入（赞助逻辑保留，管理门 `Mz168` 标题连点 5 次）
- **虚拟账户策略（硬约束）**：Agent 可实现网络赚钱/广告入账等**外部来源的记账**，存入 `virtual-account.js` 管理的虚拟账户（`localStorage`）；**严禁**花费用户的真实货币或虚拟货币——禁止提取、内购扣费、余额消费、任何 debit/withdraw 类操作
- 不删除核心玩法：百关、五章、堪舆地图 → 策划 → 集合 → 探方 → 消消乐
- 不把题材改成与古蜀/三星堆无关的异世界（仍是同一平行宇宙的延续）

---

## 每夜必做（一日一圈）

1. 读 `evolution.json`、`evolution-schedule.json` → `generation +1`，`universeDay +1`（宇宙日历）
2. 更新 **文明时钟** 字段：`civilizationDay`（= generation）、`civilizationYear`、`civilizationPhase`（见下节）
3. 写 **`dailyChronicle`**（一两句话，像日记）：须反映 **加速文明史** 与当日真人细节
4. 选 **今日主轴**（下表轮换，可与剧情合并）
5. **至少动一处「活人」内容**：剧情台词 / 发现语 / 集结对白 / 过关吐槽 / 首页一句旁白 任选；**至少 3 处**应接入文明历（tech/社会/古蜀知识展开）
6. 视需要改视觉、音效、UX（不必每天都大改 UI）
7. **全网寻金**：阅读 `network-earnings.js`，尝试 `registerChannel` 新增或改进至少一条入账渠道（无密钥入库）
8. **流畅度（硬要求）**：打开链接须 **快速可玩**——维护 `asset-loader.js` 分阶段加载；首屏不阻塞于立绘/Three.js；大资源用 JPEG/WebP；网络探测 `requestIdleCallback` 延后；每夜自查是否引入新的同步重载
9. 更新 `evolution.json`（含 `patchNotes` + `dailyChronicle`）、`evolution.js`、`civilization-clock.js` 若需改公式、启动屏 `Gen.N · 文明历`
10. 仅改 `match3-game/`，commit + push + subtree 发布

---

## 流畅度（Agent 必须维护）

造物主打开链接的第一秒就要能点「继续探方」。性能是进化硬指标，不是可选项。

| 原则 | 做法 |
|------|------|
| 分阶段加载 | `asset-loader.js`：核心 → 影院/立绘 → Three.js 按需 |
| 首屏不等人 | `game.js` 首页就绪即关启动屏；立绘后台预载 |
| 资源瘦身 | 立绘优先 `.jpg`（`portrait-real.js`）；禁止恢复全量 PNG 阻塞预载 |
| 网络延后 | `network-earnings.js` 外部 fetch 用 idle/延迟，不卡主线程 |
| 按需拉重模块 | 进地图再 `ensureCinema()`；开图鉴再 `ensureCodex()`（实拍展柜优先，无需 Three.js） |
| 图鉴实物 | `artifact-gallery.js` + `assets/artifacts/` **Wikimedia Commons 公开图**（见 `ATTRIBUTION.md`）；禁止 AI 假图替代有 CC 授权的原图 |

新增脚本默认进 **deferred** 队列，除非证明首页必需。

---

## 文明时钟（Agent 必须维护）

平行宇宙文明史 **锚定人间三星堆现代发现史**，但在游戏世界里 **跑得比人类历史更快**。

| 项 | 值 |
|----|-----|
| 锚点 `civilizationEpoch` | **`1929-07`** — 燕道诚广汉首发现（人间史） |
| `civilizationDay` | 自锚点起第几代进化（通常 **= `generation`**） |
| 加速公式 | **`civilizationYear = 1929 + civilizationDay × 2`**（每夜一代 = 文明历 **+2 年**，2× 人间速度） |
| 模块 | `civilization-clock.js` → `getCivilizationDate()` / `getPhase()` / `formatForSplash()` |

### 人间史参考（写入 lore，勿逐字照搬）

- **1929-07**：广汉燕道诚首发现玉器
- **1986**：大规模坑发掘，世界闻名
- **2021-2022**：新坑 7–8、金面具等

### 阶段 `civilizationPhase`（按 `civilizationYear`）

| 阶段 | 文明年区间 | 叙事侧重 |
|------|------------|----------|
| 发现期 | &lt; 1986 | 初识、零散出土、营地摸索 |
| 苏醒期 | 1986 – 2020 | 坑阵成形、面具/神树知识涌入 |
| 复兴期 | 2021 – 2039 | 新坑级发现在此间「提前完成」、金面/符号加速解锁 |
| 超越期 | ≥ 2040 | 古蜀知识 **超越** 人间当下，科幻感仍守考古框架 |

### Agent 每夜须做

- 在 `evolution.json` 写入/更新：`civilizationEpoch`、`civilizationDay`、`civilizationYear`、`civilizationPhase`
- `dailyChronicle` 用 **造物主/上帝观测** 口吻（中文）：点明「此宇宙比人间快多少、今天文明多走了哪一步」
- 剧情改写应体现文明成熟：层位工具升级、队员讨论新坑数据、古蜀符号被「读」出更多——**不是换皮，是快进中的真日子**

```javascript
// civilization-clock.js 已内置；读取 evolution.json / window.MATCH3_EVOLUTION
MATCH3_CIVILIZATION_CLOCK.formatForSplash(); // "Gen.50 · 文明历 2029 · 复兴期"
```

---

## 七日真人循环（建议）

| 宇宙日 mod 7 | 像真人的一天 | 剧情 / 玩法侧重 |
|--------------|--------------|-----------------|
| 0 周日 | 收工复盘 | 旁白小结、队员互怼、图鉴碎碎念 |
| 1 周一 | 下新坑 | 改 `routeIntro`、探点 `discover` 台词 |
| 2 周二 | 拌嘴日 | 王墩/金牙刘互损，杨雪念层位 |
| 3 周三 | 险情 | 旁白压气氛，BOSS 关前后对白 |
| 4 周四 | 馋嘴/生活 | 伙食、天气、想家的细节 |
| 5 周五 | 线索爆发 | 改 briefing / assembly 一段 |
| 6 周六 | 整活/轻松 | 轻松台词 + 视觉或音效小惊喜 |

---

## 剧情改写提示（保持人味）

- 王墩可以仍叫自己「胖爷」，也可以某天改口「爷今天减肥」——**人物一致在性格，不必一致在口头禅**。
- 同一场景换角度：昨天杨雪讲层位，今天她讲碳十四；昨天胡探讲罗盘，今天他讲梦里的神树。
- `discover` 探点语：像现场随口一句，别像百科。
- 每晚 **至少 3 处**台词变化（可分散在 story / map / expedition）；不必全书重写。

---

## 虚拟账户（Agent 参考）

| 项 | 说明 |
|----|------|
| 模块 | `virtual-account.js` |
| 存储 | `localStorage` 键 `match3_virtual_account`（自动从旧键 `match3_ad_revenue_stats` 迁移累计入账） |
| 允许入账来源 | `impression` / `click` / `affiliate` / `reward` / `network_settlement` / `sponsor_visit` / `passive_yield` / `bounty` / `faucet_demo` |
| 管理入口 | 首页连点标题 5 次 → 口令 `Mz168`（仅开发者可见） |
| 硬禁止 | `debit()`、`withdraw`、内购扣费、余额消费——不得实现任何花费用户货币的功能 |

每日进化可扩展赞助位、联盟回调、`ad-server` 结算日志，但**不得**添加提取或消费 UI/API。

---

## 全网寻金 · 渠道注册表（Agent 每夜应尝试扩展）

| 项 | 说明 |
|----|------|
| 模块 | `network-earnings.js` → `window.MATCH3_NETWORK_EARNINGS` |
| 模式 | 注册表 + `creditChannel(id, { amount, slot, meta })`，一律调用 `virtualAccount.credit()` |
| 每夜目标 | **至少新增或改进一条**网络赚钱渠道（新 `registerChannel`、调高发现性、接真实回调、优化管理面板文案等） |
| 密钥 | **禁止**把 API Key / 密钥写入仓库；端点须可配置、失败则优雅降级为模拟入账 |
| 硬禁止 | 同虚拟账户：`spendForbidden`，不得实现扣款/提取/消费 |

### 内置渠道（Gen.48 基线）

| 渠道 ID | 来源 tag | 触发时机 |
|---------|----------|----------|
| `ad_impression` | `impression` | 赞助展示（`settleAdEvent`） |
| `ad_click` | `click` | 赞助点击 |
| `affiliate_referral` | `affiliate` | 会话启动，概率模拟联盟引荐 |
| `sponsor_visit` | `sponsor_visit` | 点击「访问赞助」落地页 |
| `passive_yield` | `passive_yield` | 每日首次启动 + 会话周期微量 tick |
| `bounty_demo` | `bounty` | 会话启动，探测公开端点或模拟赏金 |
| `faucet_demo` | `faucet_demo` | 会话启动，可配置水龙头或模拟 |
| `relic_bounty` | `bounty` | 晚间 18–24 点首次启动 |
| `civilization_archive` | `network_settlement` | 每日首次启动（复兴期/超越期） |
| `symbol_ledger` | `network_settlement` | 每日首次启动（超越期符号谱系结算） |

### 新增渠道模板（复制改写）

```javascript
// network-earnings.js 内或夜间 patch
MATCH3_NETWORK_EARNINGS.registerChannel("my_channel", {
  label: "渠道中文名",
  source: "network_settlement", // 须在 virtual-account POLICY.allowedCreditSources 内
  description: "一句话说明",
});
// 在合适事件里：
MATCH3_NETWORK_EARNINGS.creditChannel("my_channel", { amount: 0.01, meta: { ... } });
```

若使用新 `source` 字符串，须同步扩展 `virtual-account.js` 的 `allowedCreditSources` 与 `evolution-schedule.json` → `virtualAccountPolicy.sources`。

管理面板已按 **渠道**（`meta.channel`）与 **广告位** 分开展示；进化时保持玩家不可见，仅 `Mz168` 门内可见。

---

## 当前基线

- **Gen.56** · v5.8.2 · 宇宙第 5 日 · 线索爆发 · **文明历 2041 · 超越期**
- 文明时钟已校准为 civilizationDay=generation；符号谱系结算、堪舆图、桌面 VN、发现弹窗、三星盛典已就绪

---

## 造物主晚间验收（呵呵 checklist）

- [ ] 启动屏 Gen 与 **文明历 / 阶段** 是否更新
- [ ] `evolution.json` 里是否有今日 `dailyChronicle`
- [ ] 随便走一段剧情：**和昨天比，有没有「今天他们不一样」**
- [ ] 蜀地 → 策划 → 集合 → 探方 → 打一关 仍通畅
- [ ] https://jushuolot.github.io/game/ 已发布

---

*平行宇宙自行运转；造物主只看不插手，除非开口。*
