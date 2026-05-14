<div align="center">
  <h1>ohmyblog 后端</h1>
  <p>基于 Bun + Elysia 的博客系统后端 API，提供完整的内容与管理服务。</p>
  <p>
    <img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white" />
    <img alt="Elysia" src="https://img.shields.io/badge/Elysia-1.4-111827?style=flat" />
    <img alt="Drizzle" src="https://img.shields.io/badge/Drizzle-ORM-000000?style=flat" />
    <img alt="SQLite" src="https://img.shields.io/badge/SQLite-3-003b57?style=flat&logo=sqlite&logoColor=white" />
  </p>
</div>

## ✨ 功能特性

### 🔐 认证与权限

- [x] 注册 / 登录 / 登出
- [x] 获取与更新当前账号信息
- [x] 忘记密码验证码 + 重置密码
- [x] 管理员权限守卫（敏感接口统一鉴权）

### 📝 文章与内容

- [x] 新建草稿，返回 uuid 用于后续编辑
- [x] 列表分页 + 状态过滤 + 关键词搜索
- [x] 文章状态流转：草稿 / 发布 / 归档 / 回收站
- [x] 文章详情获取 / 保存 / 永久删除
- [x] 前台公开接口：列表、归档时间轴、slug 详情

### ⚙️ 站点配置

- [x] 外观配置：主题模式 / 色相 / 语言
- [x] 站点信息：标题 / 页脚 / 备案 / 页脚链接
- [x] 个人信息：头像 / 简介 / 社交链接 / Hero 配置
- [x] SMTP 配置（用于邮件功能）

### 🔗 友链生态

- [x] 前台友链列表 + 申请接口
- [x] 管理端分页列表 + 待审计数
- [x] 审核通过 / 拒绝 / 更新 / 删除

### 📧 邮件系统

- [x] SMTP 连接测试 + 测试邮件发送
- [x] 邮件日志列表、未读统计、全部标记已读
- [x] 邮件内容 HTML 预览（iframe 直显）

### 🖼️ 上传与资源

- [x] 网站图标 / 头像 / 社交图标上传
- [x] 首页横幅 / 文章封面 / 文章行内图上传
- [x] 资源自动处理并可通过 `/api/uploads` 访问

### 🩺 运维能力

- [x] 健康检查接口
- [x] OpenAPI 文档（开发环境）

## 🧰 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **Web 框架**: [Elysia](https://elysiajs.com/)
- **数据库 ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **数据库**: SQLite
- **数据验证**: [Zod](https://zod.dev/)
- **代码规范**: [Biome](https://biomejs.dev/)

## 🚀 快速开始

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

服务器将在 <http://localhost:3000> 启动。

### 生产环境运行

```bash
bun run start
```

### 🐳 Docker 构建与运行

> 镜像会同时打包前后端，后端通过 Elysia 挂载前端静态文件。

```bash
# 从仓库根目录进入后端
cd ohmyblog-backend

# 构建镜像（使用 scripts/Dockerfile）
bun run docker
```

```bash
# 运行镜像（端口映射决定访问端口）
docker run --rm -p 3000:3000 ohmyblog
```

访问 <http://localhost:3000> 即可打开前台页面。

## ⚡ 可用命令

| 命令 | 说明 |
| --- | --- |
| `bun run dev` | 开发模式（热重载） |
| `bun run start` | 生产模式 |
| `bun run debug` | 调试模式 |
| `bun run lint` | 代码检查 |
| `bun run format` | 代码格式化 |
| `bun run lint:fix` | 自动修复检查项 |
| `bun run db:push` | 推送 schema 到数据库 |
| `bun run db:studio` | 打开 Drizzle Studio |
| `bun run db:gen` | 生成迁移文件 |
| `bun run db:migrate` | 执行迁移 |
| `bun run build:win` | 构建 Windows 产物 |
| `bun run build:linux` | 构建 Linux 产物 |
| `bun run build:linux-musl` | 构建 Linux musl 产物 |
| `bun run build:mac` | 构建 macOS 产物 |
| `bun run docker` | 构建 Docker 镜像 |

## 🗄️ 数据库与迁移

- Drizzle 迁移位于 `db/drizzle/`
- 服务启动时会自动同步迁移

## 🧭 代码规范说明

### Biome 配置

项目使用 Biome 进行代码检查和格式化。

#### 禁用的规则

**`noNonNullAssertion`（非空断言）**

我们禁用了这个规则，原因如下：

在使用 Elysia 的 `beforeHandle` 钩子进行运行时验证时，非空断言是安全的。例如：

```typescript
.post("/avatar", async ({ user }) => {
  // 安全：beforeHandle 确保 user 不为 null
  const result = await uploadService.uploadAvatar(avatar, user!.uuid);
}, {
  beforeHandle: ensureAdminIfExists  // 运行时检查
})
```

虽然 TypeScript 类型系统中 `user` 的类型是 `JwtUserPayload | null`，但 `beforeHandle` 会在运行时拦截 `user` 为 `null` 的情况。如果 `user` 是 `null`，请求根本不会到达 handler。

Biome 的静态分析无法理解这种运行时保证，因此会误报警告。禁用此规则可以避免不必要的警告。

## 🔐 环境变量

项目会自动生成 `data/.env` 文件，包含以下配置：

- `NODE_ENV`: 运行环境（development/production）
- `PORT`: 服务器端口
- `JWT_SECRET`: JWT 签名密钥（自动生成）
- `JWT_EXP`: Token 过期时间

## 📜 API 文档

启动服务器后，访问 <http://localhost:3000/openapi> 查看 OpenAPI 文档（仅开发环境）。
