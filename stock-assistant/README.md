# Stock Assistant（Streamlit 股票助手）

在浏览器里完成：**发现标的 → 分析工作台 → 导出可读简报**。  
支持 A 股 / 港股 / 美股搜索、K 线、板块榜单、异动解读；**一键分析**、**自动刷新摘要**、**分析合集导出**（HTML 可打 PDF）。

---

## 文档索引

| 文档 | 说明 | 适合谁 |
|------|------|--------|
| [docs/PRODUCT.md](docs/PRODUCT.md) | 产品定位、功能地图、使用场景、数据来源、局限、公网访问 | 想先了解「这是什么」 |
| [docs/USER_GUIDE.md](docs/USER_GUIDE.md) | 编号步骤：本地启动、登录、自选股、生成简报、Streamlit Cloud | 第一次上手操作 |
| [EVOLUTION.md](EVOLUTION.md) | P1～P8 进化路线与验证清单 | 关心后续规划 |
| [docs/PUSH.md](docs/PUSH.md) | Webhook / 邮件 / 多用户 / cron | 自动推送同事 |
| [docs/API_READONLY.md](docs/API_READONLY.md) | 只读 JSON 快照 schema | 脚本对接 / 自动化 |
| [DEPLOY_STREAMLIT.md](DEPLOY_STREAMLIT.md) | Streamlit Cloud 公网部署专篇 | 要给同事发链接 |

---

## 本地运行（简版）

完整步骤见 [docs/USER_GUIDE.md](docs/USER_GUIDE.md#1-本地启动在你自己的电脑上)。

```bash
cd stock-assistant
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .streamlit/secrets.toml.example .streamlit/secrets.toml   # 修改密码
streamlit run app.py
```

浏览器打开 http://localhost:8501 ，使用 `secrets.toml` 中的密码登录。

或双击 `启动网页.command`（macOS）。

---

## 公网部署（同事测试）

推荐 **Streamlit Community Cloud**，详见 [DEPLOY_STREAMLIT.md](DEPLOY_STREAMLIT.md) 与 [docs/USER_GUIDE.md §5](docs/USER_GUIDE.md#5-部署到-streamlit-cloud给同事公网访问)。

| 配置项 | 值 |
|--------|-----|
| Main file path | `stock-assistant/app.py` |
| Secrets | `STOCK_ASSISTANT_PASSWORD = "强密码"` |
| 可选 | `STOCK_APP_PUBLIC_URL = "https://xxx.streamlit.app"`（侧边栏生成分享文案） |

部署前自检：`python3 scripts/cloud_preflight.py`（详见 [DEPLOY_STREAMLIT.md](DEPLOY_STREAMLIT.md)）

其他方式（Railway / Render、临时隧道）见 [docs/PRODUCT.md §6](docs/PRODUCT.md#6-公网访问)。

---

## 配置说明

| 文件 | 说明 |
|------|------|
| `.streamlit/secrets.toml.example` | 密码模板，复制为 `secrets.toml`（勿提交） |
| `.streamlit/config.toml` | Streamlit 主题与端口 |
| `requirements.txt` | Python 依赖 |

---

## 勿提交

- `.streamlit/secrets.toml`
- `.venv/`、`data/`、`__pycache__/`
