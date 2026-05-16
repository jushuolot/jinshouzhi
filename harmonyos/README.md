# 鸿蒙原生（HarmonyOS NEXT）说明

> **MVP 不内置完整 ArkTS 工程**。正式原生壳需安装 [DevEco Studio](https://developer.huawei.com/consumer/cn/deveco-studio/) 与鸿蒙 SDK。

---

## 推荐路径（成本最低）

### 方案 1：ArkWeb 壳 + 现有 H5（推荐）

1. 将 `金手指` 前端部署到 **HTTPS** 域名（如 `https://app.example.com`）  
2. 在 DevEco Studio 新建 **Empty Ability** 工程  
3. 使用 **Web** 组件加载 URL：

```typescript
// 示例（ArkTS 伪代码，以 DevEco 模板为准）
Web({ src: 'https://app.example.com' })
  .domStorageAccess(true)
  .javaScriptAccess(true)
```

4. 配置 `module.json5` 网络权限、`ohos.permission.INTERNET`  
5. 打包 `.hap` 安装到鸿蒙手机

**优点**：业务逻辑仍用现有 React H5，只维护一套。  
**缺点**：依赖网络；应用商店审核仍按社交类应用要求。

---

### 方案 2：跨端框架（后期）

若需同时支持微信小程序 + 鸿蒙 + H5，可评估：

- **uni-app**（可编译鸿蒙，需查当前版本鸿蒙支持度）  
- **Taro**  

需将现有 Vite 工程迁移，**非 MVP 范围**。

---

### 方案 3：纯 ArkTS 重写

完全用 ArkUI 重写 UI 与网络层，开发与维护成本最高，仅在有强原生需求时考虑。

---

## 与本仓库 H5 的关系

| 层级 | 目录 | 说明 |
|------|------|------|
| H5 主应用 | `client/` | 鸿蒙浏览器直接访问 |
| PWA | `client/public/manifest.webmanifest` | 可添加桌面 |
| 原生壳文档 | `harmonyos/`（本目录） | 仅说明，无完整工程 |

---

## 本地 WebView 调试

鸿蒙模拟器/真机 WebView 调试 H5 时，开发阶段可临时使用：

```text
http://<开发机局域网IP>:5173
```

生产环境 **必须使用 HTTPS**，否则混合内容、Cookie、支付可能被拦截。

---

## 上架提示（摘要）

- 注册华为开发者账号  
- 应用分类、隐私政策 URL、用户协议 URL 必填  
- 社交、实名、支付类能力需准备资质说明  
- 本 MVP 含「模拟保证金」，**不可原样上架**，需接合规支付与法务文案

详细鸿蒙手机浏览器使用见：`docs/HARMONYOS.md`
