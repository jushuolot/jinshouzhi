# 本地测试 & 从 GitHub 克隆测试

仓库地址（单仓）：**https://github.com/jushuolot/jinshouzhi**（子目录 `nuanban_github/`）  
独立仓（同步）：**https://github.com/jushuolot/nuanban**

---

## 一、从单仓克隆（推荐 · 含全部子项目）

```bash
git clone https://github.com/jushuolot/jinshouzhi.git
cd jinshouzhi/nuanban_github
```

---

## 二、仅克隆暖伴独立仓

```bash
git clone https://github.com/jushuolot/nuanban.git
cd nuanban
```

后续步骤与下面「三、一键启动」相同。

---

## 三、一键启动（后端 + 演示数据）

**前置**：已安装 [Docker Desktop](https://www.docker.com/products/docker-desktop/) 且已启动。

```bash
cd nuanban_github   # 单仓内路径，或独立 clone 的 nuanban 目录
chmod +x scripts/*.sh
./scripts/dev-test.sh
```

脚本会：

1. `docker compose up -d pocketbase`
2. 等待 API 健康检查通过
3. 执行 `./scripts/seed-demo.sh` 写入演示账号与订单

---

## 四、启动 H5 前端

**新开一个终端**：

```bash
cd packages/miniapp   # 在 nuanban_github 根目录下
cp .env.example .env
npm install
npm run dev:h5
```

浏览器打开终端里提示的地址（一般为 **http://localhost:5174**）。

### 登录方式

1. 点击 **「开发账号登录（学生）」**（须先执行过 seed）  
2. 或微信登录（演示 stub，会创建 `wx_*@nuanban.dev` 用户）

| 用途 | 账号 | 密码 |
|------|------|------|
| 后台 Admin | admin@nuanban.dev | Nuanban2025!（若登不上执行 `./scripts/pb-reset-admin.sh`） |
| 学生 | student1@test.nuanban.dev | nuanban_dev_2025 |
| 家属 | family1@test.nuanban.dev | nuanban_dev_2025 |
| 老人 | elder1@test.nuanban.dev | nuanban_dev_2025 |

---

## 五、管理后台

- 地址：http://localhost:8090/_/
- 首次或忘记密码：`./scripts/pb-reset-admin.sh`
- 导入数据模型：**Settings → Import collections** → 选 `packages/pocketbase/pb_schema.json`，**勾选 Merge**

---

## 六、推送到 GitHub（本地改完代码后）

```bash
cd nuanban_github   # 或在单仓根目录 git add nuanban_github/
git add -A
git status   # 确认没有 .env、pb_data、pb_data.bak
git commit -m "你的说明"
git push origin main
```

他人 `git pull` 后即可按本文档第二节重新测试。

---

## 七、常见问题

| 现象 | 处理 |
|------|------|
| `docker: command not found` | 安装并打开 Docker Desktop |
| 8090 无法访问 | `docker compose logs pocketbase` |
| 开发登录提示用户不存在 | `./scripts/seed-demo.sh` |
| H5 接口 404 | 确认 `.env` 里 `VITE_API_BASE_URL=/api`，且 PocketBase 在 8090 |
| 微信开发者工具 | `npm run dev:mp-weixin`，工具里勾选「不校验合法域名」 |

更多见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。
