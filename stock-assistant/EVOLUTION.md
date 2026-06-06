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
| **P7** | 智能增强 | 规划中 | 板块联动预警、语音简报摘要、API 开放 |

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

## P7：智能增强（规划中）

- 板块联动提醒、简报语音朗读摘要、只读 API

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
