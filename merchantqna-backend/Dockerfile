# 使用Node.js官方镜像作为基础镜像
FROM node:latest

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json文件
COPY package*.json ./

# 复制项目文件
COPY . .

# 暴露端口（根据项目实际使用的端口修改）
EXPOSE 3000

# 启动命令
CMD ["npu run dev"]