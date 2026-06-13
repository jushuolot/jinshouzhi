# 界面预览图（PNG）

本目录为从当前演示页截取的静态预览，便于文档或汇报引用。

| 文件 | 说明 |
|------|------|
| `01-mobile-qc.png` | 手机端 · 质控（QC）门户示例（历史会话截图） |
| `02-login-modal.png` | 角色登录弹窗（`?demo_reset=1` 清空会话后） |
| `03-desktop-map-1440.png` | 桌面端 · 宽屏下运营地图与主布局（管理员登录后） |
| `04-mobile-driver.png` | 手机端 · 司机任务与事件流（视口约 390×844） |

## 自行补拍 / 更新

1. 本地起静态服务（在 `docs/` 下）：

   ```bash
   cd docs && python3 -m http.server 8899
   ```

2. 浏览器打开：`http://127.0.0.1:8899/index.html?demo_reset=1`  
   会清空演示 `sessionStorage` 与地图首访标记，便于回到**登录页**。

3. 按需登录不同角色后，用系统截图或 Cursor 内置浏览器工具保存为 PNG 放入本目录。

线上环境亦可：`https://jushuolot.github.io/lotplatform/index.html?demo_reset=1`（需已部署含 `demo_reset` 的 `index.html`）。
