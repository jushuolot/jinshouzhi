# 金手指 — 测试成品包

本目录为 QA / 研发联调可直接使用的测试交付物。

| 文件 | 用途 |
|------|------|
| [TEST-CASES.md](./TEST-CASES.md) | 功能测试用例（步骤 + 预期 + 优先级） |
| [test-data.json](./test-data.json) | 测试账号、邀请码、边界数据 |
| [api-acceptance.http](./api-acceptance.http) | 接口验收（REST Client / IDEA 可跑） |
| [state-matrix.md](./state-matrix.md) | 状态机转移矩阵（判定表） |
| [smoke-checklist.md](./smoke-checklist.md) | 发版冒烟清单（15 分钟版） |

## 使用方式

1. 将 `api-acceptance.http` 中 `@baseUrl` 改为测试环境地址。
2. 按 `test-data.json` 在测试库造数或导入种子脚本。
3. 按 `TEST-CASES.md` 执行；发版前跑 `smoke-checklist.md`。
4. 状态类回归对照 `state-matrix.md`。

## 业务定稿摘要

- 男士：40+、邀请码、保证金 10000、分配 3 次/日、30 天可退、审核通过后 7 工作日退款
- 女士：高等教育在读、免费、系统分配、信息不公开、可暂停接收
- 无女士公开列表/搜索
