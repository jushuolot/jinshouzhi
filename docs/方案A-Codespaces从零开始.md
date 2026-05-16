# 方案 A：在 GitHub 上运行金手指（Codespaces）

**唯一推荐的云端方式。** 不用在本机折腾端口，**不需要 Render 或公网部署**，在 GitHub 云端打开项目，浏览器里就能用。

日常更新见：[发布与更新.md](./发布与更新.md)

仓库：**https://github.com/jushuolot/jinshouzhi**

---

## 你需要准备

- GitHub 账号：**jushuolot**（已有）
- 能上网的浏览器（Chrome / Safari 均可）
- **不需要**在本机执行 `lsof`、`npm run dev`（那是本机才用）

---

## 第 0 步：把最新代码推到 GitHub（只做一次）

若你刚改过程序、或从没推过 **`.devcontainer`** 文件夹，在本机 **Mac 终端** 执行：

```bash
cd ~/Downloads/cursor/jinshouzhi
git add .
git commit -m "docs: 方案A Codespaces 发布指南"
git push
```

没有改动时会提示 `nothing to commit`，可跳过，直接做第 1 步。

---

## 第 1 步：打开 Codespaces

1. 浏览器打开：**https://github.com/jushuolot/jinshouzhi**
2. 点击绿色按钮 **「Code」**（代码）
3. 选 **「Codespaces」** 这一栏
4. 点 **「Create codespace on main」**（在 main 分支上创建 codespace）
5. 等待 1～3 分钟，会出现类似 VS Code 的网页编辑器

**说明**：第一次会自动安装依赖并写入测试账号（`postCreateCommand`），底部终端可能还在跑，等它结束即可。

---

## 第 2 步：启动程序（只开一个终端）

1. 看页面 **下方「终端」**（没有则菜单 **Terminal → New Terminal**）
2. 在终端里 **只输入这一行**，回车：

```bash
npm run dev
```

3. 等出现类似：

```text
[client]   ➜  Local:   http://localhost:5173/
[server] 金手指 API: http://localhost:3001
```

4. **不要关这个终端**，也不要再开第二个 `npm run dev`

---

## 第 3 步：打开网页登录

1. 过几秒，页面可能 **自动弹出浏览器** 标签；若没有：
2. 看编辑器 **右下角** 或 **「端口 / PORTS」** 面板
3. 找到 **5173**（金手指-网页），点 **地球图标** 或 **Open in Browser**
4. 在打开的页面登录：
   - 手机号：`13800001001`
   - 密码：`123456`
5. 登录后可点 **「系统分配」** 试用

---

## 第 4 步：用完记得关掉（省额度）

1. 回到 GitHub 网页 → 右上角头像 → **Your codespaces**
2. 找到正在运行的 **jinshouzhi**，点 **⋯** → **Stop codespace**

下次再用：仓库页 **Code → Codespaces → 选已有的** 或重新 Create。

---

## 测试账号（密码都是 `123456`）

| 角色 | 手机号 | 说明 |
|------|--------|------|
| 男士 | 13800001001 | 已开户，可直接分配 |
| 女士 | 13900002001～03 | 男士分配成功后会提示用哪个号登录 |
| 女士 | 13900002004 | 暂停接收，不会被分配 |

女士登录后若看不到会话：看男士分配成功时 **绿色提示里的手机号**，用那个号登女士。

---

## 常见问题

### 登录提示「手机号或密码错误」

在 Codespaces 终端（新开一个标签也行，`npm run dev` 那个可继续跑）执行：

```bash
npm run seed
```

刷新网页再登录。

### 页面打不开 / 无法连接服务器

- 确认 **`npm run dev` 还在跑**，且没有红色 `[错误] 端口 3001 已被占用`
- Codespaces 里 **一般不会出现本机那种端口占用**；若占用，**关掉终端再开一个**，只执行一次 `npm run dev`

### 和本机 Mac 的区别

| 本机 | Codespaces |
|------|------------|
| `~/Downloads/cursor/jinshouzhi` | 云端已克隆仓库 |
| 要 `kill` 3001 端口 | 通常不用 |
| http://localhost:5173 | 点端口 **5173** 的公开链接 |

### 不想用 Codespaces 了

本机运行见：[从零开始.md](./从零开始.md)

---

## 5 步极简版（备忘）

1. 打开 https://github.com/jushuolot/jinshouzhi → **Code → Codespaces → Create**
2. 等环境建好
3. 终端执行：`npm run dev`
4. 打开端口 **5173** 的链接
5. 登录 `13800001001` / `123456`
