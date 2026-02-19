# ohmyblog 后端

基于 Bun + Elysia 构建的博客系统后端 API。

## 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **Web 框架**: [Elysia](https://elysiajs.com/)
- **数据库 ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **数据库**: SQLite
- **数据验证**: [Zod](https://zod.dev/)
- **代码规范**: [Biome](https://biomejs.dev/)

## 快速开始

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

## 可用命令

```bash
# 开发模式（带热重载）
bun run dev

# 生产模式
bun run start

# 调试模式
bun run debug

# 代码检查
bun run lint

# 代码格式化
bun run format

# 数据库相关
bun run db:push      # 推送 schema 到数据库
bun run db:studio    # 打开 Drizzle Studio
bun run db:gen       # 生成迁移文件
bun run db:migrate   # 执行迁移
```

## 代码规范说明

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

## 环境变量

项目会自动生成 `data/.env` 文件，包含以下配置：

- `NODE_ENV`: 运行环境（development/production）
- `PORT`: 服务器端口
- `JWT_SECRET`: JWT 签名密钥（自动生成）
- `JWT_EXP`: Token 过期时间

## API 文档

启动服务器后，访问 <http://localhost:3000/openapi> 查看 OpenAPI 文档。
