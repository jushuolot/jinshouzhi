# 暖伴 · GitHub Pages 公网演示（无需服务器 / 域名 / 信用卡）

客人打开 **固定 HTTPS 链接** 即可体验；数据在浏览器内模拟，**不需要 Render、Docker 或信用卡**。

| 组件 | 方案 |
|------|------|
| 前端 | GitHub Pages（`*.github.io`） |
| 演示数据 | 内置 **演示模式**（`VITE_DEMO_MOCK=true`） |

**客人链接：**

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

---

## 一次性：开启 GitHub Pages

1. 登录 GitHub → https://github.com/jushuolot/jinshouzhi/settings/pages  
2. **Source** → **Deploy from a branch**  
3. **Branch**：`main`，**Folder**：`/docs`  
4. **Save**，等 1～2 分钟  

详细图文：[SETUP_STEP_BY_STEP.md](./SETUP_STEP_BY_STEP.md)（只需做第 1 步）

---

## 日常：本地开发 → 同步公网

```bash
git pull
./scripts/dev-test.sh          # 本地仍用真实 PocketBase
cd packages/miniapp && npm run dev:h5

# 改完推送（Actions 自动用演示模式构建 Pages）
./scripts/sync-github.sh
```

本地开发**不用**演示模式；仅 GitHub Pages 构建时开启 Mock。

---

## 演示模式说明

- 登录页会显示：**「公网演示模式：三角色一键体验，无需后端」**  
- 学生 / 家属 / 老人主要流程可点通（待接单、发现列表、待支付等）  
- 数据为固定样例，刷新页面会重置部分状态  
- 需要真实 API 时：本地 `dev-test.sh`，或日后自有服务器见 [PUBLIC_DEMO.md](./PUBLIC_DEMO.md)

---

## 临时：GitHub Codespaces（真实后端）

若要在云端跑真实 PocketBase（仍无需信用卡）：

https://github.com/codespaces/new?repo=jushuolot/jinshouzhi&devcontainer_path=nuanban_github/.devcontainer/devcontainer.json

终端：`./scripts/github-demo.sh` → PORTS **8080** 设为 Public。

---

## 故障

| 现象 | 处理 |
|------|------|
| 404 | Pages 未开或 Folder 不是 `/docs` |
| 登录页正常但旧版提示后端未启动 | 等 Actions 重建完成，或强刷缓存 |
| 本地要连真 API | 不要设 `VITE_DEMO_MOCK`，用 `dev-test.sh` |
