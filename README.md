# 项目合集（jushuolot/cursor 单仓）

本仓库汇总多个可独立运行的子项目，便于同事 **GitHub 克隆 / Codespaces / 云部署** 测试。

仓库地址：**https://github.com/jushuolot/jinshouzhi**

---

## 子项目一览

| 目录 | 说明 | 公网 / 同事测试方式 |
|------|------|---------------------|
| **根目录 `client/` + `server/`** | **金手指** — 邀请制社交 MVP（React + Node + SQLite） | **推荐** [GitHub Codespaces](docs/方案A-Codespaces从零开始.md)：`npm run dev` → 打开端口 **5173**；可选 [Render](docs/在GitHub上运行.md#render-公网可选) |
| [`stock-assistant/`](stock-assistant/README.md) | Streamlit 股票助手（板块、图表、行业对比） | [Streamlit Cloud](https://streamlit.io/cloud) 或 Railway；Secrets 配置 `STOCK_ASSISTANT_PASSWORD` |
| [`python-stock-mini/`](python-stock-mini/使用说明.txt) | 轻量 Streamlit 行情页 | 同 stock-assistant：`STOCK_APP_PASSWORD` + Streamlit Cloud |
| [`nuanban_github/`](nuanban_github/README.md) | **暖伴勤工** — uni-app + PocketBase | **GitHub Pages** 固定链接 + **Render** 免费 API（见 [GITHUB_DEMO.md](nuanban_github/docs/GITHUB_DEMO.md)）；可选 Codespaces / 自有服务器 |
| [`lo-delivery-platform/`](lo-delivery-platform/README.md) | 物流订单平台 — 产品文档 + Web 演示壳 | GitHub Pages：`Settings → Pages → /docs`；本地 `cd web && python3 -m http.server 8080` |
| [`match3-game/`](match3-game/README.md) | 三消游戏广告结算占位（WIP） | 暂无完整可玩版本；见目录 README |

> 本地重复的 `nuanban/`、`jinshouzhi/` 子目录已加入 `.gitignore`，请以根目录金手指与 `nuanban_github/` 为准。

---

## 金手指 · 最快上手（Codespaces）

👉 **[docs/方案A-Codespaces从零开始.md](docs/方案A-Codespaces从零开始.md)**

```bash
# 本机
npm install && cd server && npm install && cd ../client && npm install && cd ..
npm run seed && npm run dev
# 浏览器 http://localhost:5173  账号 13800001001 / 123456
```

生产一体构建：`npm run build && npm start` → http://localhost:3001

---

## 推送与更新

见 [docs/发布与更新.md](docs/发布与更新.md)

**切勿提交**：`.env`、`.streamlit/secrets.toml`、`pb_data/`、SQLite WAL/SHM、真实密码。

---

## 免责声明

各子项目仅供学习/内测，上线前须补齐合规、支付与隐私要求。
