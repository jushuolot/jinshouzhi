#!/bin/bash
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

