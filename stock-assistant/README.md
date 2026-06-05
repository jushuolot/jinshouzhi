# Stock Assistant（Streamlit 股票助手）

板块热度、专业 K 线、行业对比、异动解读等；数据源为公开行情接口（东方财富、雅虎等）。

## 本地运行

```bash
cd stock-assistant
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .streamlit/secrets.toml.example .streamlit/secrets.toml   # 修改密码
streamlit run app.py
```

浏览器打开 http://localhost:8501 ，使用 `secrets.toml` 中的密码登录。

或双击 `启动网页.command`（macOS）。

## 公网部署（同事测试）

### 方式 A — Streamlit Community Cloud（推荐）

1. 确保本目录已在 GitHub 仓库 `jushuolot/jinshouzhi` 的 `stock-assistant/` 下  
2. 打开 https://streamlit.io/cloud → **New app** → 选择仓库  
3. **Main file path**：`stock-assistant/app.py`  
4. **Secrets** 添加：

```toml
STOCK_ASSISTANT_PASSWORD = "强密码"
```

5. Deploy 后把生成的 `*.streamlit.app` 链接发给同事。

### 方式 B — Railway / Render

- **Build**：`pip install -r stock-assistant/requirements.txt`  
- **Start**：`streamlit run stock-assistant/app.py --server.port=$PORT --server.address=0.0.0.0`  
- 环境变量：`STOCK_ASSISTANT_PASSWORD=强密码`

### 方式 C — 临时隧道（本机已跑通时）

```bash
cloudflared tunnel --url http://localhost:8501
# 或 ngrok http 8501
```

## 配置说明

| 文件 | 说明 |
|------|------|
| `.streamlit/secrets.toml.example` | 密码模板，复制为 `secrets.toml`（勿提交） |
| `.streamlit/config.toml` | Streamlit 主题与端口 |
| `requirements.txt` | Python 依赖 |

## 勿提交

- `.streamlit/secrets.toml`
- `.venv/`、`data/`、`__pycache__/`
