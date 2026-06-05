# 暖伴公网演示 · 一步步配置（无服务器/域名）

总共 **2 步**：① GitHub Pages（前端） ② Render（API）。约 15 分钟。

---

## 第 0 步：确认代码已在 GitHub

仓库：https://github.com/jushuolot/jinshouzhi  

`main` 分支里应有文件夹 `docs/nuanban/`（内含 `index.html`）。没有则本地执行 `git pull`。

---

## 第 1 步：开启 GitHub Pages（解决 404）

1. 浏览器登录 GitHub（账号 **jushuolot**）
2. 打开：**https://github.com/jushuolot/jinshouzhi/settings/pages**
3. 找到 **Build and deployment**
4. **Source** 下拉选：**Deploy from a branch**
5. **Branch**：
   - 第一个框选 **`main`**
   - 第二个框选 **`/docs`**（不是 `/ (root)`）
6. 点 **Save**
7. 等 1～3 分钟，页面上方出现绿字：`Your site is live at https://jushuolot.github.io/jinshouzhi/`

### 验证

浏览器**新开无痕窗口**打开：

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

应看到 **暖伴勤工** 登录页（有「开发登录（学生）」等按钮）。

仍 404？检查 Source 是否为 `main` + `/docs`，并强刷 **Cmd+Shift+R**。

---

## 第 2 步：部署 Render API（解决登录失败）

登录页能开但点按钮提示「后端未启动」→ 需要这一步。

### 2.1 注册并连接 GitHub

1. 打开 https://render.com 用 GitHub 登录
2. 右上角 **New +** → **Blueprint**

### 2.2 导入仓库

1. 选仓库 **`jushuolot/jinshouzhi`**
2. Render 会读取 `render.yaml`，看到两个服务：`jinshouzhi`（金手指）和 **`nuanban-demo`**（暖伴）
3. 若只想部署暖伴，可只勾选/保留 **`nuanban-demo`**（或两个都部署）
4. 点 **Apply** / **Deploy Blueprint**
5. 等待约 5～10 分钟，状态变 **Live**

记下 API 地址，例如：

```
https://nuanban-demo.onrender.com
```

### 2.3 首次：导入数据表（仅一次）

1. 浏览器打开：`https://nuanban-demo.onrender.com/_/`
2. 首次进入会要求 **创建管理员**（邮箱密码自设，演示用即可）
3. 登录后：**Settings**（左下齿轮）→ **Import collections**
4. 下载仓库里的 schema 文件：  
   https://raw.githubusercontent.com/jushuolot/jinshouzhi/main/nuanban_github/packages/pocketbase/pb_schema.json  
   保存到电脑后，在 Import 界面选择该文件，勾选 **Merge**，确认导入

### 2.4 写入演示账号

终端或浏览器访问（把域名换成你的 Render 地址）：

```bash
curl -X POST "https://nuanban-demo.onrender.com/api/nuanban/seed-demo?key=nuanban_dev_seed"
```

返回 JSON 含 `"ok": true` 或类似成功信息即可。

### 2.5 让前端连上 API（若 Render 地址不是默认名）

若 Render 服务名不是 `nuanban-demo`，需在 GitHub 配置变量后重新发布前端：

1. 打开 https://github.com/jushuolot/jinshouzhi/settings/variables/actions
2. **New repository variable**：`NUANBAN_API_URL` = `https://你的服务名.onrender.com`（不要带 `/api`）
3. 打开 **Actions** → **Nuanban GitHub Pages** → **Run workflow** 手动跑一次

默认已指向 `https://nuanban-demo.onrender.com`，服务名一致则跳过 2.5。

---

## 第 3 步：发给客人

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

客人点「开发登录（学生/家属/老人）」即可。

> Render 免费档休眠后，**第一次打开可能慢 30～60 秒**，属正常。

---

## 日常更新

```bash
git pull
# 本地改代码、自测…
git add . && git commit -m "你的说明" && git push
```

推送后 Actions 会自动更新 `docs/nuanban/`；Render API 不用每次重部署。

---

## 故障对照

| 现象 | 原因 | 处理 |
|------|------|------|
| GitHub 404 | Pages 未开或 Folder 不是 `/docs` | 重做第 1 步 |
| 有登录页，点按钮报后端未启动 | Render 未部署 | 做第 2 步 |
| 登录报用户不存在 | 未 seed | 执行 2.4 的 curl |
| 很慢 | Render 唤醒 | 等一会再试 |
