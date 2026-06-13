# H5 WebRTC 实时语音 · 部署与验收

> 暖伴订单语音 MVP：H5 使用 WebRTC P2P + PocketBase 内存信令；微信小程序走独立 fork（`wx.joinVoIPChat`）。

## 架构

```
┌─────────────┐     POST/GET /call/signal      ┌──────────────┐
│  H5 客户端 A │ ◄────────────────────────────► │  PocketBase  │
│  (学生)      │     轮询信令 (offer/answer/ice) │  hooks 内存   │
└──────┬──────┘                                └──────▲───────┘
       │ WebRTC P2P 音频                               │
       │ (STUN/TURN 辅助 NAT 穿透)                     │
┌──────▼──────┐                                       │
│  H5 客户端 B │ ◄─────────────────────────────────────┘
│  (家属/老人) │
└─────────────┘
```

- **信令**：`ORDER_CALL_SIGNAL_MEM`（与订单聊天类似，进程内内存，重启丢失）
- **媒体**：浏览器 `RTCPeerConnection` 直连；复杂 NAT 需 TURN（coturn）
- **鉴权**：`orderChatCanAccess` + 订单 `in_service` 才可 POST 信令

## 环境变量

### PocketBase（docker-compose / `.env`）

| 变量 | 说明 | 默认 |
|------|------|------|
| `NUANBAN_STUN_URLS` | 逗号分隔 STUN | `stun:stun.l.google.com:19302` |
| `NUANBAN_TURN_URL` | TURN URI（可选） | — |
| `NUANBAN_TURN_USER` | TURN 用户名 | — |
| `NUANBAN_TURN_PASS` | TURN 密码 | — |

### Miniapp H5

本地开发默认连 `http://localhost:8090/api`，无需额外配置。生产在构建时设置 `VITE_API_BASE_URL`。

## Coturn（可选 TURN）

本地开发多数情况下 STUN 即可；跨网段 / 对称 NAT 需 TURN。

### Docker Compose profile

```bash
docker compose --profile webrtc up -d
```

或单独运行：

```bash
docker run -d --name nuanban-coturn --network host \
  -e TURN_USERNAME=nuanban \
  -e TURN_PASSWORD=nuanban_turn_secret \
  coturn/coturn \
  -n --log-file=stdout \
  --external-ip=<公网IP> \
  --listening-port=3478 \
  --fingerprint --lt-cred-mech \
  --user=nuanban:nuanban_turn_secret \
  --realm=nuanban.local
```

PocketBase 环境：

```env
NUANBAN_TURN_URL=turn:your-host:3478
NUANBAN_TURN_USER=nuanban
NUANBAN_TURN_PASS=nuanban_turn_secret
```

## H5 手工验收（双标签页）

**前提**：本地 PocketBase + seed 数据，存在 `in_service` 订单（学生 `13800000001` 与家属 `13800000004`）。

1. 启动后端：`docker compose up -d pocketbase`
2. 启动 H5：`cd packages/miniapp && npm run dev:h5`
3. **标签页 A**：登录学生 → 进入进行中订单 → 点「实时语音通话」→ 允许麦克风
4. **标签页 B**（隐身窗口）：登录家属 → 同一订单 → 订单密聊或详情 → 进入通话页  
   - 发起方：点按钮自动跳转  
   - 被叫方：可调用 `joinOrderVoiceCall(orderId)` 或同样点按钮（`initiator=0`）
5. 预期：双方状态「通话中」，可听到对方声音；挂断后返回上一页

**Mock（GitHub Pages）**：信令走 `demo-mock.ts` 内存，WebRTC 仍可在两标签页间测试（同浏览器 localStorage 会话需不同账号）。

## API 摘要

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/nuanban/orders/{id}/call` | 通话信息 / 发起（含 `mode`, `roomId`, `iceServers`, `clientId`） |
| GET | `/api/nuanban/orders/{id}/call/signal?clientId=&since=0` | 轮询信令 |
| POST | `/api/nuanban/orders/{id}/call/signal` | 发送 `{ type, clientId, sdp?, candidate? }` |

信令类型：`join` | `offer` | `answer` | `ice` | `hangup`

## 微信小程序 fork

| 平台 | 实现 | 代码位置 |
|------|------|----------|
| H5 | WebRTC + PB 信令 | `webrtc-voice-call.ts`, `order-voice-call.vue` |
| MP-WEIXIN | **待接入** `wx.joinVoIPChat` | `order-voice-call.ts` `#ifdef MP-WEIXIN` |

微信侧需：

1. 小程序后台开通实时语音组件能力
2. 用服务端生成 `groupId` / `nonceStr` / `timeStamp` / `signature`（不可沿用 PB 内存信令）
3. 将 `OrderVoiceCallButton` 在 MP 分支改为调 `wx.joinVoIPChat`，挂断调 `wx.exitVoIPChat`

隐私号 PSTN（`uni.makePhoneCall`）保留为非 H5、非微信端的兜底路径。

## 自动化

```bash
docker compose restart pocketbase   # hooks 变更后
node scripts/test-product-smoke.mjs # 含 WebRTC 信令冒烟
```
