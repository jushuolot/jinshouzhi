# 金手指 — 测试说明（精简版）

完整用例见上级目录：`../../docs/jinshouzhi-test/TEST-CASES.md`（若存在）。

## 冒烟 15 条（发版前勾选）

- [ ] S1 男士：邀请码 + 满40实名 + 模拟支付 → 开户成功  
- [ ] S2 男士：未满40 → 不能支付  
- [ ] S3 男士：我的邀请码已显示  
- [ ] S4 系统分配 1 次成功，能进聊天  
- [ ] S5 保证金余额 10000 元  
- [ ] S6 女士：学籍 MOCK_OK 通过  
- [ ] S7 女士：暂停接收后不被新分配  
- [ ] S8 无女士列表页  
- [ ] S9 聊天内可举报  
- [ ] S10 男士看不到对方学校/真名  
- [ ] S11 API `/api/users/female/list` 返回 403  
- [ ] S12 男士同日第 4 次分配失败  
- [ ] S13 配额显示 3 次/日  
- [ ] S14 未满 30 天退款申请失败  
- [ ] S15 满 30 天（改库 open_success_at）可申请退款  

## 接口抽检

使用 `../../docs/jinshouzhi-test/api-acceptance.http`（需 REST Client 插件），或将 `baseUrl` 改为 `http://localhost:3001/api`。

## 测试数据

`npm run seed` 后见根目录 `README.md` 测试账号表。
