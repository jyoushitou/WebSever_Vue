# ============================================================
# Dockerfile — Vue 3 项目 Docker 多阶段构建（生产环境）
# ============================================================
# 策略：多阶段构建（Multi-stage Build）
#   阶段 1（builder）：安装依赖 + 构建生成 dist/
#   阶段 2（运行）：用 Nginx 承载静态文件
# 优点：
#   1. 最终镜像只包含 Nginx + dist/，体积小（约 25MB）
#   2. 构建阶段的 node_modules 不会带入最终镜像
#   3. 利用 Docker 缓存层，package.json 不变时加速构建
# 使用方式：
#   docker build -t vue-app .
#   docker run -p 60907:80 vue-app
# ============================================================

# ====================================================================
# 阶段 1：构建（builder）
# 基础镜像：Node.js 20 Alpine，体积小，仅用于编译
# ====================================================================
FROM docker.m.daocloud.io/library/node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# ---------- 安装依赖 ----------
# 先 COPY package.json 再 npm ci，利用 Docker 缓存层加速
# 只要 package.json 没变，就不会重新安装依赖
COPY package*.json ./

# npm ci：比 npm install 更严格，依赖版本锁定在 package-lock.json
# 设置 npm 镜像源为 npmmirror，加速国内下载
# 安装完后清理缓存，减小镜像层体积
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci && npm cache clean --force

# ---------- 构建 Vue 项目 ----------
# 复制所有源代码（已被 .dockerignore 过滤掉 node_modules/ 等）
COPY . .

# 执行 Vite 构建，输出到 dist/ 目录
RUN npm run build

# ====================================================================
# 阶段 2：运行（Nginx）
# 基础镜像：Nginx Alpine，轻量级 HTTP 服务器
# ====================================================================
FROM docker.m.daocloud.io/library/nginx:alpine

# ---------- 设置时区 ----------
# 安装 tzdata 时区数据包，配置为 Asia/Shanghai（北京时间）
# 配置完立即删除 tzdata，保持镜像最小
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata

# ---------- 部署构建产物 ----------
# 从 builder 阶段复制 dist/ 到 Nginx 的静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置，覆盖默认配置
# nginx.conf 中配置了 SPA 路由支持、API 代理、缓存策略
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ---------- 安全设置 ----------
# 修改静态文件目录的所有者为 nginx（非 root 用户运行）
# 设置目录权限为 755（rwxr-xr-x），文件默认为 644
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# ---------- 暴露端口 ----------
# Nginx 监听 80 端口（docker-compose.yml 映射到宿主机 60907）
EXPOSE 80

# ---------- 启动 Nginx ----------
# nginx -g daemon off：前台运行，保持容器不退出
CMD ["nginx", "-g", "daemon off;"]
