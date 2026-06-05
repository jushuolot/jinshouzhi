# 暖伴 · 暂用 GitHub 公网演示（无云服务器、无自有域名）

客人使用 **固定 HTTPS 链接**，无需克隆仓库；本地只开发并 `git push`，**不用保持本机终端运行**。

| 组件 | 托管 | 客人链接 |
|------|------|----------|
| H5 前端 | **GitHub Pages** | `https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login` |
| API 后端 | **Render 免费子域** | 由前端内置地址访问（如 `https://nuanban-demo.onrender.com/api`） |

---

## 一次性配置（维护者）

### 1. 开启 GitHub Pages（必做，否则 404）

1. 打开 https://github.com/jushuolot/jinshouzhi/settings/pages  
2. **Build and deployment → Source** 选 **Deploy from a branch**  
3. **Branch** 选 `main`，**Folder** 选 **`/docs`**，点 Save  
4. 等 1～2 分钟，再打开客人链接

> 不要用「GitHub Actions」作 Source；本项目把构建产物放在 `docs/nuanban/`，由 workflow 自动更新。

### 2. 部署 Render API（免费，无需买服务器/域名）

1. https://render.com → **New → Blueprint**  
2. 连接仓库 `jushuolot/jinshouzhi`  
3. 导入 `nuanban_github/render.yaml`（或根目录合并后的 blueprint）  
4. 等待 `nuanban-demo` 上线，记下地址，例如 `https://nuanban-demo.onrender.com`  
5. 首次写入演示数据：

```bash
curl -X POST "https://nuanban-demo.onrender.com/api/nuanban/seed-demo?key=nuanban_dev_seed"
```

### 3. 配置 GitHub 仓库变量

仓库 **Settings → Secrets and variables → Actions → Variables**：

| 变量名 | 示例值 |
|--------|--------|
| `NUANBAN_API_URL` | `https://nuanban-demo.onrender.com` |
| `GITHUB_REPO` | `jinshouzhi`（与仓库名一致，决定 Pages 子路径） |

### 4. 本地记录客人链接（可选）

```bash
cp config/github.env.example config/github.env
# 按需修改 NUANBAN_DEMO_URL、NUANBAN_API_URL
```

---

## 日常：本地开发 → 同步公网

```bash
# 本地保持最新
git pull origin main
./scripts/dev-test.sh
cd packages/miniapp && npm run dev:h5

# 改完自测通过后
./scripts/sync-github.sh
```

推送后 GitHub Actions 自动构建 H5 并发布 Pages；**可立即关电脑**，公网由 GitHub + Render 托管。

---

## 客人怎么用

打开固定链接（维护者发）：

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

登录页点 **「开发登录（学生 / 家属 / 老人）」**。

> Render 免费实例休眠后，**首次打开可能慢 30～60 秒**，属正常现象。

---

## 临时演示：GitHub Codespaces

不想配 Render 时，可在 **GitHub 云端** 开 Codespaces（非本机）：

1. https://github.com/codespaces/new?repo=jushuolot/jinshouzhi&devcontainer_path=nuanban_github/.devcontainer/devcontainer.json  
2. 终端：`./scripts/github-demo.sh`  
3. **PORTS → 8080 → Public**，复制 `*.app.github.dev` 链接发给客人  

Codespace 停止后链接失效；**长期演示请用 Pages + Render**。

---

## 常见问题

| 现象 | 处理 |
|------|------|
| Pages 404 | 确认 Settings → Pages 为 GitHub Actions；看 Actions 是否绿 |
| 登录失败 | 对 Render URL 再执行一次 seed-demo curl |
| API 很慢 | Render 免费档唤醒中，等一会刷新 |
| 有服务器后 | 可改用 [PUBLIC_DEMO.md](./PUBLIC_DEMO.md) 自建域名 |
