# --- 阶段 1: 构建阶段 ---
FROM oven/bun:latest AS builder

ARG GIT_COMMIT=unknown
LABEL git-commit=$GIT_COMMIT

WORKDIR /app

# 复制依赖定义并安装
COPY package.json ./
RUN bun install --frozen-lockfile

# 强制安装 musl 版本的 native 模块，以便在 builder (glibc) 中编译出 alpine 兼容包
RUN bun add bun-image-turbo-linux-x64-musl

# 复制源代码及构建脚本
COPY . .

# 执行针对 musl 的编译 (用于 Alpine)
RUN bun run scripts/build.ts linux-musl

# --- 阶段 2: 运行阶段 ---
FROM alpine:latest

# 从构建阶段继承 GIT_COMMIT
ARG GIT_COMMIT=unknown
ENV GIT_COMMIT=$GIT_COMMIT
LABEL git-commit=$GIT_COMMIT

# 设置运行时环境变量，确保应用以生产模式运行
ENV NODE_ENV=production

WORKDIR /app

# 安装必要的运行库
# - ca-certificates: 用于 HTTPS 请求
# - libstdc++: Bun 运行时依赖
RUN apk add --no-cache \
    ca-certificates \
    libstdc++ \
    && rm -rf /var/cache/apk/*

# 从构建阶段复制编译好的资源
# 仅复制必要的二进制文件、native 模块和迁移文件，忽略 README 和 sourcemaps
COPY --from=builder /app/scripts/dist/linux-musl/ohmyblog /app/
COPY --from=builder /app/scripts/dist/linux-musl/image-turbo.linux-x64-musl.node /app/
COPY --from=builder /app/scripts/dist/linux-musl/db/ /app/db/

# 设置程序执行权限
RUN chmod +x /app/ohmyblog

# 定义数据挂载点
VOLUME ["/app/data"]

# 声明服务端口
EXPOSE 3000

# 运行程序
CMD ["./ohmyblog"]
