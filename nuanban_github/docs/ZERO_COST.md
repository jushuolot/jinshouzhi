# 暖伴勤工 · 零成本运行说明

本仓库默认 **不依赖付费云服务**，适合演示、内测与本地联调。

## 公网演示（客人）

| 项 | 方案 | 费用 |
|----|------|------|
| 前端托管 | GitHub Pages（`docs/nuanban/`） | 免费 |
| 数据/API | 浏览器内 `demo-mock.ts` | 免费 |
| 更新方式 | `git push` → Actions 自动构建发布 | 免费 |

固定链接见 [DEMO_LINK.md](./DEMO_LINK.md)。

## 本地联调（维护者）

```bash
./scripts/dev-test.sh          # Docker 启动 PocketBase
cd packages/miniapp && npm run dev:h5
```

| 项 | 方案 | 费用 |
|----|------|------|
| 数据库/API | PocketBase 本地 Docker | 免费 |
| 微信登录/支付 | 开发登录 + 模拟支付 stub | 免费（未接商户号） |

## 可选免费增强（已用）

- 绑定码 QR 图：`api.qrserver.com`（无需 API Key，仅 H5 联网展示）
- 演示定位：H5 定位失败时回退上海坐标

## 刻意未接入（避免费用/资质）

- 微信支付商户、微信开放平台认证
- Render / 云服务器 / 域名（见 [PUBLIC_DEMO.md](./PUBLIC_DEMO.md) 备用）
- 短信、模板消息、商业地图 Key（可选免费申请高德 JS API Key，见 `packages/miniapp/.env.example` 中 `VITE_AMAP_KEY`）

## 日常全自动同步公网

```bash
git add -A && git commit -m "..." && git push origin main
```

约 2～5 分钟后 Pages 更新；或使用 `./scripts/sync-github.sh`。
