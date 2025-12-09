# 使用Nginx作为基础镜像
FROM nginx:alpine

# 维护者信息
LABEL maintainer="MerchantQnA Team"

# 复制构建产物到Nginx的静态文件目录
COPY dist/ /usr/share/nginx/html/

# 复制自定义Nginx配置（如果需要）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露5173端口
EXPOSE 5173

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]