# 在 GitHub 上运行「金手指」

## 推荐：GitHub Codespaces（浏览器即用）

**不用本机杀端口，开箱即测。**

👉 **完整步骤：[方案A-Codespaces从零开始.md](./方案A-Codespaces从零开始.md)**

一键创建：https://github.com/codespaces/new?repo=jushuolot/jinshouzhi

1. 仓库 → **Code → Codespaces → Create codespace on main**
2. 终端：`npm run dev`
3. **端口 5173** → 在浏览器中打开（勿直接开 3001）
4. 登录 `13800001001` / `123456`

Codespaces 会自动分配 **公网 HTTPS 预览 URL**，可直接发给同事。

---

## Render 公网（可选 · 长期固定网址）

适合需要 **24h 在线、固定域名** 的演示（免费档可能休眠）。

1. 登录 https://render.com → **New → Blueprint**
2. 连接仓库 `jushuolot/jinshouzhi`，导入根目录 `render.yaml`
3. 等待构建（`npm run build:deploy`）与健康检查 `/api/health`
4. 部署完成后访问 Render 提供的 `https://<app>.onrender.com`

> SQLite 数据在 Render 免费实例重启后可能丢失；演示前可 SSH/Shell 执行 `npm run seed` 重建测试账号。

---

## 本机运行（可选）

见 [从零开始.md](./从零开始.md)

---

## 本地改代码后同步

见 [发布与更新.md](./发布与更新.md)

---

## 同仓其他子项目

见根目录 [README.md](../README.md)：`stock-assistant`、`nuanban_github`、`lo-delivery-platform` 等。

仓库：https://github.com/jushuolot/jinshouzhi
