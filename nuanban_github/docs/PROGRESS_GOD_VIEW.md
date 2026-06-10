# 暖伴勤工 · 上帝视角（产品进度）

> **核心目标**：让**附近的中老年人**与**在校大学生**匹配上；大学生提供**有偿陪护**；**平台负责撮合与管理**。  
> 更新：自动化审计通过后刷新 · 公网 demo 零成本栈

## 一句话进度

**演示栈核心撮合能力约 88%** — 三种路径均可走通（两条 live + 机构派单 demo）；缺真实微信支付与云常驻 API。

| 指标 | 数值 | 说明 |
|------|------|------|
| 服务老人（演示） | 8 | 5km 内 discover / 地图 |
| 大学生志愿者 | 6 | 老人端「找陪护」 |
| 待接单池 | 10 | 学生抢单 / 机构派单 |
| 订单总量 | 27+ | 全状态覆盖 |
| 最近审计 | **PASS** | `./scripts/audit.sh` |

## 三种撮合路径（产品核心）

```
┌────────────────┐   ┌─────────────────────┐   ┌────────────────────┐
│ ① 机构派单      │   │ ② 老人找同学         │   │ ③ 同学找需求        │
│ 平台指定订单    │   │ 附近列表 + 预约 SKU  │   │ 待接单池 + 附近老人 │
│ admin-hub      │   │ caregivers/list     │   │ order/pending      │
│ org-dispatch   │   │ order/create        │   │ discover/list      │
│ 状态: demo ✅   │   │ 状态: live ✅        │   │ 状态: live ✅       │
└────────────────┘   └─────────────────────┘   └────────────────────┘
```

### 有偿闭环（演示）

| 环节 | 状态 | 入口 |
|------|------|------|
| 明码标价 SKU | ✅ | 服务项 amount_cents |
| 家属代付 | ✅ demo | family/order/pay mock 微信 |
| 学生服务 | ✅ | 接单 → 签到 → 完成 |
| 学生收入/结算 | ✅ demo | income + settlements |
| 平台对账导出 | 🟡 | PB Admin / 无自动 settlement Hook |

## 交互看板（H5）

| 入口 | URL |
|------|-----|
| **动画演示** | [#/pages/common/demo-tour](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/demo-tour) |
| **上帝视角 KPI** | [#/pages/common/god-view](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/god-view) |
| **演示链接分享** | [#/pages/common/share-demo](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/share-demo) |
| 登录页 | [#/pages/common/login](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login) |
| 深链 | `launch?tour=1` · `launch?god=1` · `launch?share=1` |

详见 [DEMO_ANIMATION.md](./DEMO_ANIMATION.md)

## 自动化审计（我刚跑的）

```bash
./scripts/audit.sh   # 路由 + 数据 + API + 构建 + 冒烟
```

| 步骤 | 结果 |
|------|------|
| 路由 39 条 | OK |
| 富数据规模 | OK |
| API 34 paths parity | OK |
| build:h5 | OK |
| 公网 HTTP 200 | OK |

## 阶段总览

| Phase | 主题 | 与核心的关系 |
|-------|------|----------------|
| 1–5 | 公网 demo + 富数据 | 可演示撮合数据 |
| 6–8 | 学校合作、派单、验收 | 平台筛选与派单 |
| 9–11 | 列表/守卫/多角色 | 成熟度 |
| 0 R2 | audit 自动化 | 你可只看结果 |
| **12** | **上帝视角看板** | **进度可视化** |

## 仍未做（上线项）

- 微信商户支付 / 登录
- 云服务器公网 API（当前 GitHub Pages + mock）
- 订单完成自动写 settlements
- 全分包 nav-guard

## 5 分钟验收（给你）

1. 打开 [上帝视角](https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/god-view) 看 KPI  
2. `elder1` → 找陪护 → 预约  
3. `student1` → 待接单 10 单 → 接单 → 完成 → 收入  
4. 登录页 → 运营演示 → 派单  

---

*本文档由 agent 在审计通过后更新；有问题让你重做时，先跑 `audit.sh` 对照此表。*
