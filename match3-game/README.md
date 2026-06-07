# 萌植消消乐

8×8 三消小游戏，100 关，关头/关尾赞助广告，开发者隐藏收益后台。

## 本地运行

```bash
cd match3-game
python3 -m http.server 3456
# 浏览器 http://localhost:3456
```

## 配置

| 文件 | 说明 |
|------|------|
| `ad-config.js` | 广告开关、倒计时、管理口令 |
| `landing/sponsors.js` | 内置赞助落地页文案 |

管理后台：连续点击标题 5 次 → 输入口令（默认见 `ad-config.js`）。

## 公网地址

https://jushuolot.github.io/game/

推送 `match3-game/**` 后 GitHub Actions 自动部署（见 `.github/workflows/deploy-match3.yml`）。
