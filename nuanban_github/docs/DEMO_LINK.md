# 暖伴勤工 · 客人演示指南

## 客人（公网 · 固定链接）

**直接打开下面链接**（无需安装、无需克隆、无需连 WiFi）：

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

1. 微信 / 手机浏览器 / 电脑浏览器打开  
2. 点 **「开发登录（学生 / 家属 / 老人）」**  

| 按钮 | 演示路径 |
|------|----------|
| 开发登录（学生） | 首页待接单 → 发现（列表）→ 我的 |
| 开发登录（家属） | 待支付订单 → 模拟支付 |
| 开发登录（老人） | 找陪护 → 学生1 → 一键求助 |

> 首次访问若加载较慢，可能是在唤醒免费 API（约 30～60 秒）。地图 H5 可能空白，**列表模式可完整演示**。

---

## 维护者

| 场景 | 做法 |
|------|------|
| 本地开发 | `git pull` → `./scripts/dev-test.sh` → `npm run dev:h5` |
| 同步到公网 | `./scripts/sync-github.sh`（push 后自动发布，**无需本机开终端**） |
| 首次搭建 | [GITHUB_DEMO.md](./GITHUB_DEMO.md) |
| 日后有服务器 | [PUBLIC_DEMO.md](./PUBLIC_DEMO.md) |

---

## 演示账号

| 角色 | 邮箱 |
|------|------|
| 学生 | student1@test.nuanban.dev |
| 家属 | family1@test.nuanban.dev |
| 老人 | elder1@test.nuanban.dev |

登录页一键按钮即可。
