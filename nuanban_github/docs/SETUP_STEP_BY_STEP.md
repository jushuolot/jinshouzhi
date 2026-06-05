# 暖伴公网演示 · 一步步配置（无需信用卡）

只需 **1 步**：开启 GitHub Pages。不需要 Render、不需要云服务器。

---

## 第 1 步：开启 GitHub Pages

1. 浏览器登录 GitHub（**jushuolot**）
2. 打开：**https://github.com/jushuolot/jinshouzhi/settings/pages**
3. **Build and deployment → Source** 选 **Deploy from a branch**
4. **Branch**：`main`，**Folder**：**`/docs`**
5. 点 **Save**
6. 等 1～3 分钟，出现：`Your site is live at https://jushuolot.github.io/jinshouzhi/`

### 验证

无痕窗口打开：

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

应看到登录页，底部提示：**「公网演示模式：三角色一键体验，无需后端」**。

点 **开发登录（学生）** 应能进入首页。

---

## 发给客人

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

---

## 日常更新

```bash
git pull
# 本地改代码…
git push
```

推送后 GitHub Actions 自动更新 `docs/nuanban/`。

---

## 本地开发（真实后端）

公网演示用 Mock；本地联调用 Docker：

```bash
./scripts/dev-test.sh
cd packages/miniapp && npm run dev:h5
```

---

## 故障

| 现象 | 处理 |
|------|------|
| 404 | Folder 必须是 `/docs`，强刷 Cmd+Shift+R |
| 提示后端未启动 | 清除缓存；确认 Pages 已更新到最新 commit |
| 想要真实 API 公网 | 见 [PUBLIC_DEMO.md](./PUBLIC_DEMO.md) 或 Codespaces（[GITHUB_DEMO.md](./GITHUB_DEMO.md)） |
