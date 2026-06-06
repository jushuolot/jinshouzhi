# Stock Assistant 产品进化路线图

目标：**简单、便捷、快速**完成个股与市场分析；每次迭代可独立使用，并同步 GitHub。

## 当前版本定位

| 阶段 | 主题 | 状态 | 交付物 |
|------|------|------|--------|
| **P1** | 结构 + 可读资料 | ✅ 已完成 | 工作台导航、可读简报导出、Tab 命名 |
| **P2** | 页面模块化 | ✅ 已完成 | `src/ui/pages/*` 拆分 app.py |
| **P3** | 一键分析链路 | ✅ 已完成 | 选标的 → 自动拉行情/评分/简报/路线 |
| **P4** | 协作与公网 | ✅ 已完成 | Streamlit Cloud 稳定部署、分享链接模板 |
| **P5** | 智能持久化 | ✅ 已完成 | 摘要/简报落盘、今日速览、健康检测、新手引导 |
| **P6** | 体验极限 | ✅ 已完成 | 移动端、定时刷新、多简报合并 HTML/PDF |
| **P7** | 智能增强 | ✅ 已完成 | 板块联动、语音朗读、只读 JSON 快照 |
| **P8** | 生态扩展 | ✅ 已完成 | Webhook/邮件推送、多用户隔离、cron 脚本 |
| **P9** | 运维观测 | ✅ 已完成 | 推送日志、重试队列、健康告警 Webhook |
| **P10** | 导出增强 | ✅ 已完成 | CSV、筛选排序、备份脚本 |
| **P11** | 文档与版本 | ✅ 已完成 | 页脚版本、进化日志、snapshot v2 |
| **P12** | 百步进化 | ✅ 已完成 | [120 步清单](docs/EVOLUTION_100.md)、v1.8.0 |
| **P13** | 智能提醒 | ✅ 已完成 | 涨跌幅/评分阈值、提醒 Markdown |
| **P14** | 运维脚本 | ✅ 已完成 | evolve_verify、health_check_cron、历史 CSV |
| **P15** | 体验抛光 | ✅ 已完成 | 评分徽章、深链接 tab、v1.9.0 step 150 |
| **P16** | 双股对比 | ✅ 已完成 | 并排涨跌幅/评分/摘要、对比 Markdown |
| **P17** | 提醒推送 | ✅ 已完成 | 提醒 Webhook、自动推送、alert_push |
| **P18** | 体验与 v2 | ✅ 已完成 | ?tab= 自动切换、v2.0.0 step 180 |
| **P19** | 自选分组 | ✅ 已完成 | watch_groups 偏好、分组筛选与管理 |
| **P20** | 历史趋势 | ✅ 已完成 | trend_summary、工作台/历史页 📈 趋势 |
| **P21** | 备份导入 | ✅ 已完成 | JSON 备份下载/合并导入、v2.1.0 step 210 |
| **P22** | 快捷筛选 | ✅ 已完成 | 搜索页快捷筛选、代码列表复制 |
| **P23** | 定时摘要 | ✅ 已完成 | cron 摘要含提醒、`--alerts-only` |
| **P24** | 体验抛光 | ✅ 已完成 | 深色偏好持久化、v2.2.0 step 240 |
| **P25** | 板块热力图 | ✅ 已完成 | sector_heatmap、工作台 🗺 板块分布 |
| **P26** | 批量操作 | ✅ 已完成 | 多选删除、批量加入分组 |
| **P27** | 文档与 v2.3 | ✅ 已完成 | EVOLUTION 241–270、v2.3.0 step 270 |
| **P28** | 笔记/标注 | ✅ 已完成 | user_prefs.watch_notes、工作台笔记 expander |
| **P29** | 性能/缓存 | ✅ 已完成 | 摘要刷新 60s in-session 缓存 |
| **P30** | 文档与 v2.4 | ✅ 已完成 | EVOLUTION 271–300、v2.4.0 step 300 |
| **P31** | 笔记导出 | ✅ 已完成 | 速览/CSV/JSON 备份含 watch_notes |
| **P32** | 健康面板 | ✅ 已完成 | 缓存统计、上次刷新、推送日志尾部 |
| **P33** | 文档与 v2.5 | ✅ 已完成 | EVOLUTION 301–330、v2.5.0 step 330 |
| **P34** | 搜索历史 | ✅ 已完成 | user_prefs.search_history、搜索页 chips 重搜 |
| **P35** | 提醒模板 | ✅ 已完成 | 保守/均衡/激进 阈值一键套用 |
| **P36** | 文档与 v2.6 | ✅ 已完成 | EVOLUTION 331–360、v2.6.0 step 360 |

## P1：信息架构（本次）

**问题**：7 个 Tab 平铺、功能分散、缺少「读完就能决策」的文档。

**改动**：
1. 侧边栏 **三步工作流**：发现 → 分析 → 导出
2. Tab 按使用顺序编号命名
3. **分析工作台** 增加「可读分析简报」（Markdown，可下载）
4. 行动路线报告可在工作台直接阅读，不必跳转

## P2：代码结构（已完成）

- `app.py` 只负责路由与登录
- 各 Tab 迁入 `src/ui/pages/watch.py` 等
- 单元测试：`tests/test_readable_report.py`、`tests/test_score_stock.py`

## P3：快速分析（已完成）

- 按钮「**一键分析**」：并行拉 K 线 + 评分 + 简报 +（A 股）财务对比摘要 + 行动路线
- 自选股列表显示：最新涨跌幅、评分、一句话摘要（「刷新全部摘要」）

## P4：公网与迭代（已完成）

- `DEPLOY_STREAMLIT.md`：Secrets、Reboot 流程、分享文案模板
- `scripts/cloud_preflight.py`：云端依赖与编译自检（启动脚本 / CI 自动跑）
- 侧边栏 **「📤 分享给同事」**：配置 `STOCK_APP_PUBLIC_URL` 后一键复制说明
- GitHub Actions：push 到 `stock-assistant/` 时跑 preflight + 单元测试
- 迭代：`git push` → Streamlit Cloud **Reboot app**

## P5：智能持久化（已完成）

- **摘要 / 简报落盘**：`watch_snapshots` 与 `brief_md_*` 写入 `data/user_history.json`（v3）
- **今日自选股速览**：工作台一键下载合并 Markdown
- **批量深度分析**：「深度分析前 3 只」并行完整一键分析
- **新手引导**：首页空状态三步提示
- **数据源健康**：侧边栏东财 / Yahoo 连通性检测

## P6：体验极限（已完成）

- **移动端 CSS**：窄屏 Tab/按钮/表格更易点、少横向滚动
- **自动刷新摘要**：工作台可设 5～30 分钟间隔（页面打开时生效，设置会保存）
- **分析合集导出**：合并所有「一键分析」简报 → `.md` 或 `.html`（浏览器打印即 PDF）
- **深色主题**：`.streamlit/config.toml` 统一观感

## P7：智能增强（已完成）

- **板块联动扫描**：多只 A 股自选是否共用行业/概念（工作台 expandable）
- **🔊 朗读摘要**：浏览器 TTS 朗读「一句话」摘要（无需安装插件）
- **只读 snapshot.json**：侧边栏导出，schema `stock-assistant-readonly-v1`（见 [docs/API_READONLY.md](docs/API_READONLY.md)）

## P8：生态扩展（已完成）

（见上文表格与 `docs/PUSH.md`）

## P9–P12：百步进化（已完成）

详见 **[docs/EVOLUTION_100.md](docs/EVOLUTION_100.md)**（120 步全部 ✅）

要点：
- **P9**：`push_log.jsonl`、Webhook/邮件退避重试、重试队列、`STOCK_HEALTH_ALERT_WEBHOOK_URL`
- **P10**：自选股 CSV、筛选/排序、 `scripts/backup_data.py`
- **P11**：页脚 v1.8.0、侧边栏进化日志、snapshot v2
- **P12**：测试 30+、累计进化 step 120

## P16–P18：对比、提醒推送、v2.0（已完成）

- **P16 双股对比**：工作台「📊 双股对比」expander，并排涨跌幅/评分/一句话/财务摘要，可下载 `.md`
- **P17 提醒推送**：`push_webhook_on_alerts` 偏好；有触发项时「推送到 Webhook」；自动刷新后可选自动推送（去重）
- **P18 体验**：`?tab=watch|search|…|1-7` 自动选中主导航；`src/ui/tab_router.py`

## P19–P21：分组、趋势、备份（已完成）

- **P19 自选分组**：`user_prefs.watch_groups`；工作台按分组筛选、分组管理 expander
- **P20 历史趋势**：`src/analysis/trend_summary.py`；最近 N 次分析的评分/涨跌幅走势
- **P21 备份导入**：工作台 JSON 备份下载与合并导入（不覆盖历史 query_log）

## P22–P24：快捷筛选、定时摘要、体验抛光（已完成）

- **P22 快捷筛选**：`src/ui/quick_actions.py`；搜索页预设筛选（涨幅/评分/有摘要）+ 可复制代码列表
- **P23 定时摘要**：`push_digest_cron.py` 摘要嵌入提醒段落；`--alerts-only` 仅在有触发项时推送
- **P24 体验抛光**：`user_prefs.dark_mode` 侧边栏切换；v2.2.0 step 240

## P25–P27：板块分布、批量操作、v2.3（已完成）

- **P25 板块热力图 lite**：`src/analysis/sector_heatmap.py`；工作台「🗺 板块分布」按 fin_summary/简报聚合
- **P26 批量操作**：多选标的 → 批量移出自选 / 批量加入分组；`src/util/batch_watch_ops.py`
- **P27 文档与 v2.3**：EVOLUTION_100 步 241–270；v2.3.0 step 270；README cron `--alerts-only` 说明

## P28–P30：笔记、缓存、v2.4（已完成）

- **P28 笔记/标注**：`user_prefs.watch_notes`；工作台单标的「📝 笔记/标注」expander，持久化到 `user_history.json`
- **P29 性能/缓存**：`src/util/fetch_cache.py`；同一批 ticker 60 秒内重复「刷新全部摘要」/自动刷新跳过网络拉取
- **P30 文档与 v2.4**：EVOLUTION_100 步 271–300；v2.4.0 step 300；`evolve_verify.sh` 覆盖 P28–P30 测试

## P31–P33：笔记导出、健康面板、v2.5（已完成）

- **P31 笔记导出**：`format_notes_digest_section`；速览 Markdown、CSV「笔记」列、JSON 备份 `watch_notes`；cron/推送摘要同步
- **P32 健康面板**：`cache_stats`、上次摘要刷新时间、推送日志尾部 5 条；`test_p32_health_panel` 逻辑测试
- **P33 文档与 v2.5**：EVOLUTION_100 步 301–330；v2.5.0 step 330；`evolve_verify.sh` 覆盖 P31–P33 测试

## P34–P36：搜索历史、提醒模板、v2.6（已完成）

- **P34 搜索历史**：`user_prefs.search_history`（最近 20 条）；搜索页 chips 一键重搜；`test_p34_search_history`
- **P35 提醒模板**：`src/util/alert_profiles.py`；保守/均衡/激进 pct/score 阈值；alert_panel 一键套用
- **P36 文档与 v2.6**：EVOLUTION_100 步 331–360；v2.6.0 step 360；`evolve_verify.sh` 覆盖 P34–P36 测试

## 进化原则

1. **先可读，再炫功能** — 每轮至少产出一种「能发给同事看的资料」
2. **先本地稳，再公网** — 本地 `启动网页.command` 通过后再部署
3. **小步提交** — 每个 Phase 独立 commit，便于任意终端 `git pull` 回滚

## 本地验证清单

```bash
cd stock-assistant
source .venv/bin/activate
python3 -m py_compile app.py
streamlit run app.py
```

- [x] 登录正常
- [x] 工作台 → 选标的 → 生成可读简报 → 下载 .md
- [x] 全球搜索 → 加入自选股
- [x] 板块/榜单可刷新
- [x] 自选股「刷新全部摘要」显示涨跌幅/评分/一句话
- [x] 「一键分析」生成简报 + 行动路线 + A 股财务摘要
- [x] `python3 scripts/cloud_preflight.py` 通过后可 push / Reboot Cloud
- [x] 侧边栏分享文案（配置 `STOCK_APP_PUBLIC_URL`）
- [x] 关闭浏览器后再开，自选股摘要/简报仍保留（`data/user_history.json`）
- [x] 下载「今日自选股速览」合并 Markdown
- [x] 自动刷新自选股摘要（⏱ 可设间隔）
- [x] 下载「分析合集」HTML / Markdown（可打印 PDF）
- [x] 板块联动扫描（A 股多自选）
- [x] 朗读一句话摘要 · 导出 snapshot.json
- [x] Webhook / 邮件推送速览 · 多用户密码隔离
- [x] 推送日志 + 重试队列 + 健康告警 Webhook
- [x] 自选股 CSV / 筛选 / 排序
- [x] **120 步进化完成**（见 docs/EVOLUTION_100.md）
- [x] 智能提醒阈值（🔔 涨跌幅/评分）
- [x] 历史记录导出 CSV · `scripts/evolve_verify.sh`
- [x] v1.9.0 · 进化 step 150
- [x] 双股对比 expander · 下载对比 Markdown
- [x] 提醒 Webhook 推送 · push_webhook_on_alerts
- [x] ?tab= 深链接自动打开对应页 · v2.0.0 step 180
- [x] 自选股分组筛选与管理 · watch_groups
- [x] 分析历史趋势 expander · trend_summary
- [x] JSON 备份下载/合并导入 · v2.1.0 step 210
- [x] 搜索页快捷筛选 · 代码列表复制 · P22
- [x] cron 摘要含提醒 · --alerts-only · P23
- [x] 深色模式偏好 · v2.2.0 step 240 · P24
- [x] 板块分布热力图 lite · 批量自选操作 · P25–P26
- [x] v2.3.0 · 进化 step 270 · P27
- [x] 自选笔记/标注 · watch_notes · P28
- [x] 摘要刷新 in-session 缓存 · fetch_cache · P29
- [x] v2.4.0 · 进化 step 300 · P30
- [x] 笔记导出到速览/CSV/JSON · watch_notes · P31
- [x] 健康面板缓存/刷新/推送尾 · P32
- [x] v2.5.0 · 进化 step 330 · P33
- [x] 搜索历史 chips · search_history · P34
- [x] 提醒模板 保守/均衡/激进 · alert_profiles · P35
- [x] v2.6.0 · 进化 step 360 · P36
