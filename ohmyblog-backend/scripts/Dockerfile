# --- 阶段 1: 构建前端 ---
# Build context 为 monorepo 根目录（即 ohmyblog-refactor/）
# 钉死 Bun 版本以保证 Bun.Image (1.3.14+) 等内置 API 行为稳定
FROM oven/bun:1.3.14 AS frontend-builder

WORKDIR /monorepo

# 安装后端依赖（vite.config.ts 的 alias 需要 backend node_modules 中的 elysia、typebox 等）
COPY ohmyblog-backend/package.json ohmyblog-backend/bun.lock ./ohmyblog-backend/
RUN cd ohmyblog-backend && bun install --frozen-lockfile

# 安装前端依赖
COPY ohmyblog-frontend/package.json ohmyblog-frontend/bun.lock ./ohmyblog-frontend/
RUN cd ohmyblog-frontend && bun install --frozen-lockfile

# 复制源代码（alias 路径解析需要两侧目录同时存在）
COPY ohmyblog-backend/ ./ohmyblog-backend/
COPY ohmyblog-frontend/ ./ohmyblog-frontend/

# 编译前端（跳过 type-check 加速 Docker 构建）
WORKDIR /monorepo/ohmyblog-frontend
RUN bun run build-only

# --- 阶段 2: 构建后端 ---
FROM oven/bun:1.3.14 AS builder

WORKDIR /app

# 复制依赖定义并安装
COPY ohmyblog-backend/package.json ohmyblog-backend/bun.lock ./
RUN bun install --frozen-lockfile

# 复制后端源代码及构建脚本
COPY ohmyblog-backend/ .

# 从 Stage 1 注入前端构建产物（build.ts 会将其复制到 dist/public/）
COPY --from=frontend-builder /monorepo/ohmyblog-frontend/dist ./frontend-dist

# 执行针对 musl 的编译 (用于 Alpine)
# 图像处理由 Bun 运行时内置 Bun.Image 提供，无 native 模块依赖
RUN bun run scripts/build.ts linux-musl

# --- 阶段 3: 运行阶段（Alpine 最小化） ---
FROM alpine:3.23

# 从构建阶段继承 GIT_COMMIT 和 APP_VERSION
ARG GIT_COMMIT=unknown
ARG APP_VERSION=unknown
ENV GIT_COMMIT=$GIT_COMMIT
ENV APP_VERSION=$APP_VERSION
LABEL git-commit=$GIT_COMMIT
LABEL app-version=$APP_VERSION

# 设置运行时环境变量
ENV NODE_ENV=production

# 安装运行时依赖 + su-exec（轻量 gosu 替代，仅 ~10KB）
RUN apk add --no-cache \
    ca-certificates \
    libstdc++ \
    su-exec \
    && addgroup -S app \
    && adduser -S -G app -u 10001 app \
    && mkdir -p /app/data \
    && chown -R app:app /app

WORKDIR /app

# 从构建阶段复制编译好的资源
COPY --from=builder --chmod=755 /app/scripts/dist/linux-musl/ohmyblog /app/ohmyblog
COPY --from=builder /app/scripts/dist/linux-musl/db/ /app/db/
COPY --from=builder /app/scripts/dist/linux-musl/public/ /app/public/

# 复制 entrypoint 脚本
COPY ohmyblog-backend/scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 定义数据挂载点
VOLUME ["/app/data"]

# 声明服务端口
EXPOSE 3000

# 以 root 启动 entrypoint，由脚本内部降权到 app 用户
ENTRYPOINT ["/app/entrypoint.sh"]
