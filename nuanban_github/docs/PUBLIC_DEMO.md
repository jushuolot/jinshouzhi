# 公网演示站 · 自有服务器（可选）

> **当前无云服务器/域名时**，请用 [GITHUB_DEMO.md](./GITHUB_DEMO.md)（GitHub Pages + Render）。

## 模型

```
本地 Mac/PC                    云服务器（常驻）
─────────────                  ─────────────────────────
git pull          开发          Docker: pocketbase + caddy
dev-test.sh                    HTTPS 域名 → H5 + /api
npm run dev:h5
       │
       │  git push + ssh
       ▼
sync-public.sh  ──────────►  deploy-public.sh
                             （build H5 + 重启容器）
```

- **客人**：只访问 `https://<演示域名>/#/pages/common/login`  
- **本地**：开发与自测，关电脑不影响公网  
- **不再使用**：cloudflared / localtunnel 等临时隧道  

## 文件

| 文件 | 说明 |
|------|------|
| `config/formal.env` | 域名、正式入口链接、SSH（gitignore） |
| `Caddyfile.prod` | 由 `deploy-public.sh` 生成，勿手改 |
| `Caddyfile.prod.example` | 域名模板 |
| `docker-compose.prod.yml` | 80/443、隐藏 8090、放宽 CORS |
| `scripts/deploy-public.sh` | 在**服务器**执行 |
| `scripts/sync-public.sh` | 在**本地**推送并触发部署 |

## 服务器要求

- Ubuntu 22.04+ 或同类 Linux  
- Docker Compose v2  
- Node.js 18+（构建 H5）  
- 域名 A 记录 → 服务器公网 IP  
- 防火墙/安全组：入站 **80、443**（不要公网暴露 8090）  

## 运维命令（在服务器项目目录）

```bash
# 查看状态
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 日志
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f caddy pocketbase

# 手动重新部署
./scripts/deploy-public.sh

# 仅刷新演示数据
NUANBAN_API=http://localhost:8090 ./scripts/seed-demo.sh
```

## 备份

定期打包 `packages/pocketbase/pb_data`（SQLite + 上传文件）。
