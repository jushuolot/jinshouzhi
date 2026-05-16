# 金手指

成熟男士（40+）邀请制 + 文明互动保证金；高等教育在读女士认证；**系统分配**、女士信息不对外公开。

> **MVP 仅供本地学习与内测**，支付与学籍为模拟，上线前须补齐合规与真实接口。

---

## 在 GitHub 上运行（方案 A · 推荐）

**不用本机终端、不用管 3001 端口占用**，在浏览器里打开云端项目即可：

👉 **[docs/方案A-Codespaces从零开始.md](docs/方案A-Codespaces从零开始.md)**

仓库：https://github.com/jushuolot/jinshouzhi → **Code → Codespaces → Create** → 终端 `npm run dev` → 打开端口 **5173**

---

## 本机快速开始

**在本机 Mac 运行请看：[docs/从零开始.md](docs/从零开始.md)**

```bash
cd /Users/chenli/Downloads/cursor/jinshouzhi
npm install && cd server && npm install && cd .. && cd client && npm install && cd ..
npm run seed
npm run dev
```

- 电脑浏览器：<http://localhost:5173>  
- 接口健康检查：<http://localhost:3001/api/health>

### 测试账号（密码均为 `123456`）

| 角色 | 手机号 | 说明 |
|------|--------|------|
| 男士 | 13800001001 | 已开户，邀请码 `INV_M001` |
| 女士 | 13900002001 | 已学籍认证 |
| 管理 | 13700000000 | 后台扣罚/退款（需调 admin 接口） |

新男士注册：绑定邀请码 `INV_M001` → 实名（满40岁）→ 模拟支付 1 万  
新女士：实名（满18）→ 学籍验证码 `MOCK_OK`

---

## 鸿蒙系统使用

**无需安装包**：鸿蒙手机与电脑连同一 WiFi，浏览器打开：

```text
http://<你电脑的局域网IP>:5173
```

详细步骤、添加桌面、常见问题见：**[docs/HARMONYOS.md](./docs/HARMONYOS.md)**

原生鸿蒙 App（ArkWeb 壳 / DevEco）见：**[harmonyos/README.md](./harmonyos/README.md)**

### 鸿蒙相关特性

- 安全区 `safe-area`、动态视口 `100dvh`  
- 触控优化、禁用点击高亮、字体缩放控制  
- PWA：`manifest.webmanifest` + `sw.js`（支持时可将 H5 添加到桌面）  
- 开发/生产服务监听 `0.0.0.0`，便于局域网真机调试  

---

## 生产构建（单端口）

```bash
npm run build
npm start
```

访问 <http://localhost:3001>（前后端一体）。

---

## 目录结构

```text
jinshouzhi/
  client/          React H5（支持鸿蒙浏览器 / PWA）
  server/          Node API + SQLite
  docs/            鸿蒙使用说明、测试文档
  harmonyos/       原生壳说明（无完整 ArkTS 工程）
```

---

## 推送到 GitHub

```bash
cd ~/Downloads/cursor/jinshouzhi
git add .
git commit -m "更新说明"
git push
```

---

## 免责声明

本项目不构成法律或金融建议。涉及保证金、在校大学生用户、实名与支付等功能上线前，请咨询合规与法务，并办理相应资质。
