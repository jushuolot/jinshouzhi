# Stock Assistant 产品进化路线图

目标：**简单、便捷、快速**完成个股与市场分析；每次迭代可独立使用，并同步 GitHub。

## 当前版本定位

| 阶段 | 主题 | 状态 | 交付物 |
|------|------|------|--------|
| **P1** | 结构 + 可读资料 | ✅ 已完成 | 工作台导航、可读简报导出、Tab 命名 |
| **P2** | 页面模块化 | 待做 | `src/ui/pages/*` 拆分 app.py |
| **P3** | 一键分析链路 | 待做 | 选标的 → 自动拉行情/评分/简报/路线 |
| **P4** | 协作与公网 | 待做 | Streamlit Cloud 稳定部署、分享链接模板 |

## P1：信息架构（本次）

**问题**：7 个 Tab 平铺、功能分散、缺少「读完就能决策」的文档。

**改动**：
1. 侧边栏 **三步工作流**：发现 → 分析 → 导出
2. Tab 按使用顺序编号命名
3. **分析工作台** 增加「可读分析简报」（Markdown，可下载）
4. 行动路线报告可在工作台直接阅读，不必跳转

## P2：代码结构（下一步）

- `app.py` 只负责路由与登录
- 各 Tab 迁入 `src/ui/pages/watch.py` 等
- 单元测试：`readable_report`、`score_stock`

## P3：快速分析（下一步）

- 按钮「一键分析」：并行拉 K 线 + 评分 + 简报 +（A 股）财务对比摘要
- 自选股列表显示：最新涨跌幅、评分、一句话摘要

## P4：公网与迭代（下一步）

- `DEPLOY_STREAMLIT.md` 维护
- `requirements.txt` 云端自检
- 每轮进化：`git commit` → `git push` → Streamlit Reboot

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
