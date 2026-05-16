#!/bin/bash
cd "$(dirname "$0")"
echo "进入项目: $(pwd)"
echo ""

# 先释放端口
for port in 3001 5173 5174 5175; do
  pids=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pids" ] && kill $pids 2>/dev/null; sleep 0.3
  pids=$(lsof -ti :$port 2>/dev/null)
  [ -n "$pids" ] && kill -9 $pids 2>/dev/null
done

echo "启动中... 请勿关闭本窗口"
echo "浏览器打开: http://localhost:5173"
echo "账号 13800001001  密码 123456"
echo ""
npm run dev
