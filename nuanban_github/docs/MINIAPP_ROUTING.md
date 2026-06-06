# 暖伴勤工 · 小程序路由与分包

> 以 `packages/miniapp/src/pages.json` 为 **唯一真相**。

## 1. V1 已上线页面结构

```
主包 pages/common/
  launch           启动（深链 role/target/id）
  login            微信登录（演示流程）+ 开发账号（student1/2/3、家属、老人）
  role-select      多角色选择
  register         注册角色（写 user_roles）
  agreement        用户协议与隐私说明
  org-dispatch     机构派单演示（零成本 Mock）
  admin-hub        运营演示入口（派单 + 学校合作）
  school-coop      学校合作配置（只读）
  student-pending  学生资质审核中拦截页

分包 package-elder/
  home
  caregivers/list    找陪护（附近学生）
  caregivers/detail
  order/create       预约（POST /nuanban/elder/orders）
  order/list
  order/detail
  bind-code          家属绑定码
  settings           无障碍设置
  profile

分包 package-family/
  home
  bind               绑定老人
  order/list
  order/pay          模拟支付
  order/detail
  outdoor/approve    外出审批
  package/buy        服务包购买（mock 下单 → 待支付）
  profile

分包 package-student/
  home
  discover/list      附近老人 + 学校合作筛选
  discover/elder     老人详情
  order/pending      待接单列表（scroll-view）
  order/active       服务中
  order/request      接单 / 拒单 / 签到 / 完成
  income             收入明细
  schedule/list      排班
  schedule/checkin   到场签到
  schedule/log       服务日志
  profile
  profile/edit       编辑资料（学校 / 显示名）
```

## 2. 深链

| 参数 | 说明 |
|------|------|
| `role` | `elder` \| `family` \| `student` |
| `target` | 页面 key（如 `order-pay`） |
| `id` | 业务 ID |

示例：`/pages/common/launch?role=family&target=order-pay&id=<orderId>`

`launch` 流程：校验 token → 若无 `activeRole` 则 `role-select` → `reLaunch` 到对应分包首页或目标页。

## 3. TabBar

未使用微信原生三套 tabBar。各分包首页内嵌 **`RoleTabBar`**（`config/tabs.ts`），按 `activeRole` 切换 Tab 配置。

## 4. 角色切换

- 存储：`pinia` `store/role.ts` + `uni.setStorageSync('activeRole')`  
- 多角色：登录后或 `role-select` 页选择  
- **注意**：切换身份应调用 `roleStore.setActiveRole()`，**不要** 请求已废弃的 Nest `POST /auth/switch-role`

## 5. 导航守卫

`utils/nav-guard.ts`：

1. 已登录（`access_token`）  
2. `activeRole` 与分包前缀一致  
3. 学生角色需 `user_roles.status === active`

## 6. 演示专用入口

| 路径 | 说明 |
|------|------|
| login → 用户协议 | 合规说明 |
| login → 机构派单 | 替代 Admin 后台，派 pending_accept 给林同学 |
| family/home → 服务包购买 | 套餐占位，无真实支付 |

产品说明见 [PRODUCT.md](./PRODUCT.md) §10、§12。
