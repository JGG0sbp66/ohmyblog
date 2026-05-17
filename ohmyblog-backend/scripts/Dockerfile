# --- 阶段 1: 构建前端 ---
# Build context 为 monorepo 根目录（即 ohmyblog-refactor/）
FROM oven/bun:latest AS frontend-builder

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
FROM oven/bun:latest AS builder

ARG GIT_COMMIT=unknown
LABEL git-commit=$GIT_COMMIT

WORKDIR /app

# 复制依赖定义并安装
COPY ohmyblog-backend/package.json ohmyblog-backend/bun.lock ./
RUN bun install --frozen-lockfile

# 强制安装 musl 版本的 @napi-rs/image 模块，以便在 builder (glibc) 中编译出 alpine 兼容包
RUN bun add @napi-rs/image-linux-x64-musl

# 删除 builder 默认随 optionalDependencies 安装的 glibc 版 native 模块，
# 否则 bun build 静态分析会同时把两份 .node 都嵌入二进制，多出约 12MB 死重
RUN rm -rf node_modules/@napi-rs/image-linux-x64-gnu

# 复制后端源代码及构建脚本
COPY ohmyblog-backend/ .

# 从 Stage 1 注入前端构建产物（build.ts 会将其复制到 dist/public/）
COPY --from=frontend-builder /monorepo/ohmyblog-frontend/dist ./frontend-dist

# 执行针对 musl 的编译 (用于 Alpine)
RUN bun run scripts/build.ts linux-musl

# --- 阶段 3: 运行阶段 ---
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
# 仅复制必要的二进制文件、迁移文件和前端产物
# 注意：image.linux-x64-musl.node 已被 bun build 静态嵌入 standalone 二进制内
# （位于 /$bunfs/root/），运行时由 @napi-rs/image 自动 fallback 加载，
# 无需在 /app/ 下额外拷贝一份磁盘版（避免约 13.4MB 重复）。
COPY --from=builder --chmod=755 /app/scripts/dist/linux-musl/ohmyblog /app/
COPY --from=builder /app/scripts/dist/linux-musl/db/ /app/db/
COPY --from=builder /app/scripts/dist/linux-musl/public/ /app/public/

# 定义数据挂载点
VOLUME ["/app/data"]

# 声明服务端口
EXPOSE 3000

# 运行程序
CMD ["./ohmyblog"]
