# 股票助手 · Streamlit Cloud 公网部署（给朋友用）

让朋友**只打开浏览器**即可使用，无需安装 Python。

## 1. 登录并创建 App

1. 打开 https://share.streamlit.io ，用 **GitHub** 登录  
2. 点 **Create app** / **New app**  
3. 填写：
   - **Repository**：`jushuolot/jinshouzhi`
   - **Branch**：`main`
   - **Main file path**：`stock-assistant/app.py`

## 2. 设置密码（Secrets）

在 **Secrets** 中粘贴（密码请自行修改）：

```toml
STOCK_ASSISTANT_PASSWORD = "给同事用的密码"
```

## 3. 部署

点 **Deploy**，等待 2～5 分钟，状态变为 **Running** 后复制 `https://xxx.streamlit.app` 链接发给同事。

## 4. 若出现 “Error installing requirements”

1. 点 **Manage app** → **Reboot app**（会按最新 `requirements.txt` 重装）  
2. 确认主文件路径为 `stock-assistant/app.py`（依赖文件在 `stock-assistant/requirements.txt`）  
3. 仍失败时：在 App 设置里把 **Python version** 设为 **3.10** 或 **3.11** 后重新部署  

当前依赖已去掉 `curl_cffi`（云端常编译失败），港股/美股走 `yfinance 0.2.x`。

## 5. 同事怎么用

打开你发的 `https://xxx.streamlit.app` → 输入密码 → 使用。
