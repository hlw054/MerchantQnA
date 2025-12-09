#!/bin/bash

# 部署脚本 - 用于在服务器上部署前端应用

# 设置变量
APP_NAME="merchantqna-backend"
IMAGE_NAME="merchantqna-backend:latest"
CONTAINER_NAME="merchantqna-backend"

# 颜色定义
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m" # No Color

echo -e "${GREEN}开始部署后端应用...${NC}"

# 拉取最新代码
echo -e "${YELLOW}拉取最新代码...${NC}"

# 停止并移除旧的容器
echo -e "${YELLOW}停止并移除旧的容器...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true
docker rmi $IMAGE_NAME 2>/dev/null || true
echo -e "${GREEN}清理旧容器和镜像成功${NC}"

# 构建Docker镜像
echo -e "${YELLOW}构建Docker镜像...${NC}"
docker build -t $IMAGE_NAME .

if [ $? -ne 0 ]; then
    echo -e "${RED}构建镜像失败${NC}"
    exit 1
fi

# 启动新的容器
echo -e "${YELLOW}启动新的容器...${NC}"
docker run -d \
    --name $CONTAINER_NAME \
    -p 3000:3000 \
    --restart unless-stopped \
    $IMAGE_NAME

if [ $? -eq 0 ]; then
    echo -e "${GREEN}部署成功！应用已在 http://localhost:3000 运行${NC}"
    # 显示容器状态
    docker ps -a | grep $CONTAINER_NAME
else
    echo -e "${RED}启动容器失败${NC}"
    exit 1
fi

echo -e "${GREEN}部署脚本执行完成${NC}"
