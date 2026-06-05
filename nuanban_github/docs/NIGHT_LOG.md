# 夜间自动更新日志

> 您休息期间已推送 GitHub，Actions 会自动更新公网演示。

## 本轮（Phase 6–8 · Perfect 零成本 demo）

1. **pages.json** 注册 agreement、org-dispatch、profile/edit、package/buy
2. **login** student2 账号 + 协议/机构派单链接
3. **学校合作** discover/list + `school-coop.ts` + ORG_SCHOOL_PARTNERS
4. **资料编辑** profile/edit + PATCH profile（mock + PB hooks）
5. **机构派单** org-dispatch 页 + GET dispatchable / POST dispatch
6. **家属服务包** package/buy 演示页 + home 入口
7. **待接单** pending.vue scroll-view（10 单压测）
8. **student.ts** `updateStudentProfile()` 辅助
9. **文档** PERFECT.md、ROADMAP Phase 6–10+、GAP_AUDIT、MINIAPP_ROUTING

## 公网链接

```
https://jushuolot.github.io/jinshouzhi/nuanban/#/pages/common/login
```

建议先 **Cmd+Shift+R** 强刷。

## 快速验收（5 分钟）

1. 学生 → **接单**（10 单 + scroll-view）
2. 学生 → **发现** → 学校合作开关
3. 学生 → **我的 → 编辑资料** → 改学校后再看发现
4. 登录页 → **机构派单** → 派给林同学
5. student2 登录 → 城东师范学院合作筛选
6. 家属 → **服务包购买** + 外出审批

## 零成本栈未变

见 [ZERO_COST.md](./ZERO_COST.md) — 仍无微信支付/云服务器。

## 验收清单

见 [PERFECT.md](./PERFECT.md)
