#!/bin/sh
set -e

# 确保数据目录及子目录存在且权限正确
mkdir -p /app/data/uploads /app/data/logs
chown -R 10001:10001 /app/data

# 以 app 用户 (UID 10001) 运行主程序
exec su-exec 10001:10001 /app/ohmyblog
