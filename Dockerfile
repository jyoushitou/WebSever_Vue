# ============================================================
# Dockerfile — Vue 3 项目 Docker 多阶段构建
# ============================================================

# ---------- 阶段 1：构建 ----------
FROM docker.m.daocloud.io/library/node:20-alpine AS builder

WORKDIR /app

# 复制依赖配置文件
COPY package*.json ./
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci && npm cache clean --force

# 复制源代码并构建
COPY . .
RUN npm run build

# ---------- 阶段 2：运行（Nginx） ----------
FROM docker.m.daocloud.io/library/nginx:alpine

# 设置时区
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# 将构建产物复制到 Nginx 的静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件（自定义）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 创建非 root 用户运行 nginx
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
