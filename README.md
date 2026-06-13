# 项目合集（jushuolot/jinshouzhi 单仓）

本仓库汇总多个可独立运行的子项目，便于 **GitHub 克隆 / Codespaces / 云部署**。

仓库地址：**https://github.com/jushuolot/jinshouzhi**

---

## 子项目一览

| 目录 | 说明 | 公网 / 同事测试方式 |
|------|------|---------------------|
| [`nuanban_github/`](nuanban_github/README.md) | **暖伴勤工** — uni-app + PocketBase | **GitHub Pages** 演示；本地 `./scripts/start-h5.sh` |
| [`stock-assistant/`](stock-assistant/README.md) | Streamlit 股票助手 | [Streamlit Cloud](https://streamlit.io/cloud) |
| [`python-stock-mini/`](python-stock-mini/使用说明.txt) | 轻量 Streamlit 行情页 | Streamlit Cloud |
| [`lo-delivery-platform/`](lo-delivery-platform/README.md) | 物流订单平台演示 | GitHub Pages `/docs` |
| [`match3-game/`](match3-game/README.md) | 三消游戏（WIP） | 见目录 README |

---

## 暖伴勤工 · 最快上手

```bash
cd nuanban_github
./scripts/dev-test.sh          # 终端 1：PocketBase + 种子数据
./scripts/start-h5.sh          # 终端 2：H5 开发
```

浏览器：**http://localhost:5174/#/pages/common/launch**

公网演示：**https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/launch**

详见 [nuanban_github/docs/LOCAL_TEST.md](nuanban_github/docs/LOCAL_TEST.md)

---

## 推送与更新

各子项目在其目录内开发；暖伴推送 `main` 后会由 Actions 更新 GitHub Pages。

**切勿提交**：`.env`、`pb_data/`、真实密码与密钥。

---

## 免责声明

各子项目仅供学习/内测，上线前须补齐合规、支付与隐私要求。
