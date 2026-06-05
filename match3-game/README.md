# Match3 Game（WIP）

三消小游戏 + 广告结算服务的占位目录，**当前未包含完整可玩游戏客户端**。

## 现有内容

| 路径 | 说明 |
|------|------|
| `ad-server/settlements.jsonl` | 广告曝光/结算事件样例（JSONL） |

## 本地预览（若有 landing 静态页）

```bash
cd landing
python3 -m http.server 8080
# 浏览器 http://localhost:8080
```

> 若 `landing/` 目录不存在，说明尚未合入前端资源。

## 公网测试

完整游戏与 ad-server 就绪后，可：

- 静态页 → GitHub Pages 或任意静态托管  
- ad-server → Railway / Fly.io / VPS Node 服务  

当前阶段仅供了解广告结算数据格式，**不建议作为生产部署**。
