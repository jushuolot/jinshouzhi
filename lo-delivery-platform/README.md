# LO Delivery Platform（物流订单全链条平台）— 产品原型仓库

以 **Logistics Order (LO)** 为唯一业务主语，用 **Event Ledger（事件账本）** 记录事实，通过 **引擎 + 投影（Read Models）** 驱动履约、回单、对账与多端协同。本仓库包含 **产品文档** 与 **可本地打开的 Web 演示壳**（无后端，仅 UI/信息架构示意）。

## 仓库内容

| 路径 | 说明 |
|------|------|
| `docs/` | 产品概述、架构要点、API 纲要、游戏化视角、发布说明 |
| `web/index.html` | **运营类模拟**界面：顶栏资金/声望、日时钟与倍速、订单队列（需求压力/满意度）、部门页签、数据中心看板、区域示意、收件箱、底部滚动日报、Toast |
| `docs/index.html` | 与 `web/index.html` 同步，供 GitHub Pages（`/docs`） |
| `docs/world/` | **C4I 指挥层**（PC）：控制塔 · 链战役 · 人工作业台 |
| `docs/world/field/` | **Field 现场层**（手机）：全角色统一待办壳 |
| `docs/06-rainforest-ecosystem.md` | 雨林生态圈 + C4I/城市经营 设计总纲 |
| `kernel/` | LOT 内核（链订单、业务裂变、点对点结算、IndexedDB） |
| `LICENSE` | MIT |

## 在线演示（v13.1.0）

- **C4I 指挥大屏**：https://jushuolot.github.io/lotplatform/world/?v=13.1.0
- **Field 手机现场**（货主/仓管/司机…）：https://jushuolot.github.io/lotplatform/world/field/
- 顶栏 **「跑一圈」** 引导：C4I 下单 → Field 逐步执行
- 设计总纲：[docs/06-rainforest-ecosystem.md](docs/06-rainforest-ecosystem.md)
- **运营模拟壳（旧版）**：https://jushuolot.github.io/lotplatform/

## 从单仓克隆

```bash
git clone https://github.com/jushuolot/jinshouzhi.git
cd jinshouzhi/lo-delivery-platform
```

## 本地预览 Web 演示

```bash
# 全球控制塔（推荐）
cd lo-delivery-platform
python3 -m http.server 8080
# http://localhost:8080/docs/world/?v=13.0.0  （指挥）
# http://localhost:8080/docs/world/field/     （手机现场）

# 旧版运营模拟壳
cd web && python3 -m http.server 8080
```

GitHub Pages（不使用 Actions、无需 PAT `workflow` 权限）：仓库 **Settings → Pages → Deploy from a branch**，Branch 选 `main`，Folder 选 **`/docs`**（使用 `docs/index.html`，与 `web/` 同步的游戏风 HUD 演示）。

## 文档阅读顺序

1. [产品概述](docs/01-product-overview.md)  
2. [架构与数据流](docs/02-architecture.md)  
3. [OpenAPI 纲要](docs/03-api-outline.md)  
4. [游戏化设计视角（可选）](docs/04-game-design-lens.md)  
5. [发布到 GitHub](docs/05-publish-to-github.md)

## 许可证

MIT — 见 [LICENSE](LICENSE)。

## 免责声明

本仓库为 **产品与工程原型文档 + 前端壳**，非生产就绪后端实现。事件名、接口路径可按贵司规范调整。
