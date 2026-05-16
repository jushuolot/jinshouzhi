#!/bin/bash
cd "$(dirname "$0")"
echo "正在写入测试账号..."
npm run seed
echo ""
echo "完成！请确保是用「启动金手指.command」启动的程序。"
read -p "按回车关闭..."
