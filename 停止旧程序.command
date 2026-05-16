#!/bin/bash
echo "=========================================="
echo "  金手指 - 关闭占用端口的旧程序"
echo "=========================================="
echo ""

for port in 3001 5173 5174 5175 5176; do
  pids=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "端口 $port 占用中，正在结束: $pids"
    kill -9 $pids 2>/dev/null
  else
    echo "端口 $port 空闲"
  fi
done

echo ""
echo "若仍无法启动，请打开「活动监视器」，搜索 node，结束所有 node 进程。"
echo "然后双击「启动金手指.command」"
echo ""
read -p "按回车关闭窗口..."
