#!/bin/bash
# 双击本文件：打开终端并启动 Streamlit（配置见 .streamlit/config.toml，监听 0.0.0.0:8501）
# 本机：http://localhost:8501 ；同网其他设备：http://本机局域网IP:8501
cd "$(dirname "$0")"
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if ! command -v python3 &>/dev/null; then
  osascript -e 'display dialog "未找到 python3，请先从 python.org 安装 Python 后再试。" buttons {"好"} default button 1'
  exit 1
fi

if [ ! -d .venv ]; then
  python3 -m venv .venv || exit 1
fi
# shellcheck source=/dev/null
source .venv/bin/activate
pip install -q -r requirements.txt || { osascript -e 'display dialog "依赖安装失败，请检查网络后重试。" buttons {"好"} default button 1'; exit 1; }

exec streamlit run app.py
