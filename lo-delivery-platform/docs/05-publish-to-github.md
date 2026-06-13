# 发布到 GitHub

本仓库已在本地 `git init` 并完成首次提交。请在你的 GitHub 账号下创建空仓库后推送。

## 1. 在 GitHub 创建仓库

- 登录 [GitHub](https://github.com/new)  
- Repository name 示例：`lotplatform`  
- **不要**勾选 “Add a README”（避免冲突）  
- 创建后复制 HTTPS 或 SSH 地址，例如：  
  - `https://github.com/<你的用户名>/lotplatform.git`  
  - `git@github.com:<你的用户名>/lotplatform.git`

## 2. 本地添加 remote 并推送

在仓库根目录执行（替换为你的地址）：

```bash
cd lo-delivery-platform
git remote add origin https://github.com/<USER>/lotplatform.git
git branch -M main
git push -u origin main
```

若使用 SSH：

```bash
git remote add origin git@github.com:<USER>/lotplatform.git
git push -u origin main
```

## 3.（可选）启用 GitHub Pages（不依赖 Actions）

为兼容 **Personal Access Token 未勾选 `workflow` 权限** 的情况，本仓库**默认不包含** `.github/workflows/`（否则推送会被 GitHub 拒绝）。

静态演示已复制到 **`docs/index.html`**（与 `web/index.html` 相同），可用 **从分支发布**（无需 Actions、无需 PAT `workflow`）：

1. 仓库 **Settings → Pages**  
2. **Build and deployment → Source** 选择 **Deploy from a branch**  
3. Branch 选 **`main`**，Folder 选 **`/docs`**  
4. 保存后等待 **1～3 分钟**（首次部署有延迟），再访问：  
   `https://<你的用户名>.github.io/<仓库名>/`（例如 `jushuolot` / `lotplatform`）

### 访问出现 404 时（按顺序检查）

1. **Source 必须是 “Deploy from a branch”**  
   若仍选 **GitHub Actions** 且仓库里没有 workflow，**不会生成站点**，会 404。请改回 **Deploy from a branch**。

2. **Folder 必须是 `/docs`**（本仓库的 `index.html` 在 `docs/` 下）  
   若选 **`/ (root)`**，根目录没有 `index.html`，也会 404。

3. **仓库需为 Public（免费账号最常见）**  
   私有仓库在免费账号下 **GitHub Pages 可能不可用或受限**。建议先把仓库设为 **Public** 再试。

4. **同一页面上看部署状态**  
   Settings → Pages 顶部是否显示 **Your site is live at …**；若显示 **building**，等完成后再刷新。

5. **本仓库已包含 `docs/.nojekyll`**  
   用于关闭 Jekyll，避免对 `docs/index.html` 处理异常导致 404。若你本地还没有该文件，请 `git pull` 后再推送。

### 若仍希望使用 GitHub Actions

在 GitHub 创建 PAT 时勾选 **`workflow`** scope，再自行添加 `.github/workflows/*.yml` 并推送。

## 4. 无 gh CLI 时

本机未安装 `gh` 时，按上述步骤用网页创建仓库 + `git push` 即可。
