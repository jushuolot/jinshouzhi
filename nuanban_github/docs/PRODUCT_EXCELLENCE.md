# 暖伴勤工 · 产品卓越原则

面向「市面最先进、最好用、最简单、最漂亮」的持续进化基线。

---

## 四大支柱

| 支柱 | 含义 | 落地 |
|------|------|------|
| **便捷** | 少点一步、待办直达 | 三端 Tab 图标化、模块地图、深度验收向导、家属待办聚合 |
| **安全** | 传输加密、权限隔离、敏感确认 | HTTPS、Bearer + X-Active-Role、安全中心、支付二次确认 |
| **清晰** | 模块边界可读 | `config/modules.ts` 单源、模块地图页、订单时间线、撮合动态 |
| **美观** | 统一暖色设计系统 | `theme.css` 设计令牌、老人大字号、玻璃态卡片 |

---

## 安全与数据

### 传输层

- **正式版（阿里云）**：Caddy 同源 `/api` + HTTPS（见 [ALIYUN_ENV.md](./ALIYUN_ENV.md)）
- **测试版**：GitHub Pages Mock，无真实资金

### 鉴权

- PocketBase JWT → `Authorization: Bearer`
- 多角色 → `X-Active-Role` 头（关键 Hooks 校验）
- `401` 自动登出并跳转登录

### 本地存储

| 数据 | 策略 |
|------|------|
| 登录令牌 | 标准 `access_token`（退出清除） |
| 验收进度 | `secure-storage.ts` 混淆存储 |
| 演示订单/钱包 | `demo-mock-state` v4（仅测试版） |

### 敏感操作

代付、确认完成、外出审批、SOS 均需 `showModal` 二次确认。

---

## 模块结构

```
pages/common/     登录 · 运营 · 模块地图 · 安全中心 · 验收向导
package-elder/    老人端
package-family/   家属端
package-student/  学生端
```

模块定义：`packages/miniapp/src/config/modules.ts`

---

## 验收入口

| 入口 | 路径 |
|------|------|
| 模块地图 | `#/pages/common/module-map` |
| 安全中心 | `#/pages/common/security` |
| 深度验收 | `#/pages/common/scenario-guide` |
| 运营演示 | `#/pages/common/admin-hub` |

---

## 开发约束（写代码时）

1. 新功能先归入 `modules.ts` 某一组
2. 涉及网络/存储 → 读 [ALIYUN_ENV.md](./ALIYUN_ENV.md)
3. Mock 与 Hooks 双端对齐（`check-api-parity.mjs`）
4. UI 复用 `nb-*` 设计类，勿散落硬编码色值
5. 敏感流程必须有确认步骤
