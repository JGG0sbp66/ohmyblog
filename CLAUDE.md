# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

自部署博客系统，由两个**独立的 Bun 包**组成（没有 workspace 根包，依赖要分别安装）：

- `ohmyblog-backend/` — Bun + Elysia + Drizzle + SQLite
- `ohmyblog-frontend/` — Vue 3 + Vite + Tailwind 4 + Pinia

生产形态是**单个可执行文件**：前端产物被塞进后端的 `public/`，由 Elysia 一起托管。所以前后端不是两个可独立部署的服务，改动时要考虑同源假设。

## 常用命令

后端（在 `ohmyblog-backend/` 下执行 —— 数据目录和迁移目录都基于 `process.cwd()`，换目录会导致读错路径）：

```bash
bun run dev            # 热重载，:3000；OpenAPI 文档在 /openapi（仅开发环境）
bun run lint           # biome lint
bun run lint:fix       # biome check --write（含格式化 + import 排序）
bun run db:gen         # 改完 db/table/*.ts 后生成迁移 SQL
bun run db:studio      # Drizzle Studio
bun run email          # react-email 预览服务，调 src/templates/*.tsx 用
bun run build:linux    # 单文件编译，产物在 scripts/dist/<platform>/
bun run docker         # 多阶段镜像（build context 是仓库根）
```

前端（在 `ohmyblog-frontend/` 下执行）：

```bash
bun run dev            # Vite :5173，/api、/feed、/sitemap.xml、/robots.txt 代理到 :3000
bun run type-check     # vue-tsc --build
bun run build-only     # 跳过类型检查直接打包（CI 和 Docker 用的就是这个）
bun run format         # prettier --write .
```

**没有任何测试。** 后端的 `test` 脚本是 `exit 1` 占位，前端没有测试脚本，仓库里也没有 `*.test.*` / `*.spec.*`。不要去找测试或假装能跑测试；验证靠 `type-check` + `lint` + 手跑。

### type-check 的既有噪音

`vue-tsc` 会顺着路径别名把**后端源码**一起检查（用的是前端的 DOM/strict 配置，没有 `bun-types`），因此 `../ohmyblog-backend/**` 下有约 40 条既有报错（`Cannot find name 'Bun'`、JSX runtime、`possibly undefined` 等）——**全是噪音，不要去修**。另有 1 条既有前端报错：`HeroSubtitleEditor.vue:40`。

甄别自己引入的新错误：

```bash
bun run type-check 2>&1 | grep '^src/'
```

## 架构要点

### 端到端类型共享（最容易踩的地方）

前端通过 Eden Treaty 直接复用后端类型，`src/api/client.ts` 里 `treaty<ServerApp>(window.location.origin)`。这依赖一组跨包路径别名，**必须同时写在两处**，只改一处会出现「Vite 能跑但 type-check 挂」或反之：

- `ohmyblog-frontend/vite.config.ts` 的 `resolve.alias`
- `ohmyblog-frontend/tsconfig.app.json` 的 `compilerOptions.paths`

别名包括 `@server/app`、`@server/dtos/*`、`@server/db/constants/*`、`@server/db/table/*`，以及把 `elysia` 和 `@sinclair/typebox` 强制指向**后端的 node_modules**（两边版本必须一致，否则类型推导直接崩）。推论：**前端的 type-check / build 需要后端已经 `bun install`**。

`db/constants/*.ts` 是前后端共享的字面量 SSOT，必须保持零依赖（纯 `as const` 数组 + 派生类型），前端才能安全 import。前端统一从 `src/api/shared.ts` 再导出，组件不要直接写 `@server/...`。

新增后端路由后，记得在 `src/index.ts` 的 `.group("/api", ...)` 里挂上，否则 Eden 的类型树里根本没有这个端点，前端调用会报「属性不存在」。

### 后端分层

`routes/*.route.ts` → `services/*.service.ts` → `daos/*.dao.ts` → `db/`（Drizzle）。

- route 只做参数校验（DTO）、鉴权（`beforeHandle`）和组装返回值，不写业务逻辑
- service 抛 `BusinessError`（`plugins/errors.ts`）表达可预期失败，带 `status`；默认 `silent: true` 不写 error 日志
- dao 只关心 SQL；缓存逻辑抽到 `daos/caches/*.cache.ts`，不要污染 dao
- service/dao 都是 `class Xxx {}` + 文件底部 `export const xxxService = new XxxService()` 单例
- DTO 用 Elysia 的 TypeBox（`t.Object`），末尾统一 `export type TXxxDTO = Static<typeof XxxDTO>`；枚举用 `utils/typebox.ts` 的 `tStringEnum(常量数组)` 生成，保持和 `db/constants` 同源

### 统一响应封装

`plugins/response.plugin.ts` 全局包装：成功 → `{ success: true, data: <handler 返回值> }`，失败 → `{ success: false, data: { message, field? } }`。已经是 `Response` / `Blob` / 含 `success` 字段的对象会原样放行。

前端 `src/api/client.ts` 的 `unwrap()` 负责拆封，**失败时 throw 的是 `data` 里的内容**——通常是后端那句中文 message 字符串，不是 Error 对象。所以前端 catch 里会看到 `if (error === "配置不存在")` 这种字符串比较，这是设计如此，不是 bug。

### 鉴权与初始化引导

- `plugins/auth.plugin.ts`：JWT 存 cookie `auth_token`，全局 `derive` 把 `user` 注入 context（无 token 则为 `null`，不抛错）；`.macro` 提供 `role: "admin"` 写法
- `plugins/adminGuard.ts` 的 `ensureAdminIfExists`：**系统还没有任何 admin 时放行**，用于 setup 向导阶段能调用管理接口。绝大多数管理端路由用的是它而不是硬性 `role`
- 前端 `router/index.ts` 全局守卫先查 `/api/health` 的 `initialized`（即「是否已存在 admin」）：为 false 时一切重定向到 `/setup`，为 true 时禁止再进 `/setup`

`biome.json` 里 `noNonNullAssertion` 被刻意关掉：`beforeHandle` 保证了 handler 里 `user!` 是安全的，Biome 静态分析看不出来（详见后端 README）。

### 演示模式（DEMO_MODE）

`DEMO_MODE` 是与 `NODE_ENV` **正交**的布尔开关（演示站本身也是 `production` 部署，只是额外禁写），不要把它做成第三个 `NODE_ENV` 值——`isProduction()` 控制着 cookie 的 `secure`/`sameSite`、SQL 日志、OpenAPI 挂载，改动 `NODE_ENV` 的取值域会连带影响这些。

- `utils/demo.ts`：`isDemoActive()` = 开关打开 **且** 已有 admin（语义对齐 `ensureAdminIfExists`，系统未初始化时演示限制整个不生效，setup 向导照常可用）。`auth.plugin.ts` 的 derive 在无有效 token 时据此注入虚拟管理员 `__demo__`，于是所有 `ensureAdminIfExists` 路由对游客可读，**route 文件一行都不用改**
- `plugins/demo.plugin.ts`：全局 `onBeforeHandle` 按 **HTTP 方法** 拦截写操作，不是维护写接口清单。**新增写路由不需要来这里登记，默认就被挡住**；反过来说，要放行必须显式加进 `DEMO_ALLOWED_PATHS`
- 虚拟身份只存在于单次请求的 context，不签 JWT、不下发 cookie，没有可窃取或伪造的凭证
- `config.route.ts` 里 `isAdmin` 额外排除了演示身份，避免游客读到 `isPublic: false` 的 smtp 配置（含密码）
- `/api/health` 返回的 `demo` 是**生效值**（开关 && 已初始化），前端直接拿它决定要不要显示演示横幅

藏在 GET 后面的写操作（`GET /api/email/logs/:uuid/preview` 的标记已读、公开文章的访问量累加）不受这道闸门约束——这是有意的，但新增此类接口时要意识到演示模式挡不住它。

### 文章内容管线

编辑器在**前端**导出三份数据（`PostEditorBody.vue`），后端原样存储、不做转换：

| 字段 | 来源 | 用途 |
| --- | --- | --- |
| `content` | `editor.getJSON()` | ProseMirror JSON，后台编辑器的唯一数据源 |
| `contentHtml` | `editor.getHTML()` | 前台详情页 + RSS 全文直接渲染 |
| `contentText` | `editor.getText()` | 搜索、列表预览、字数统计 |

前台**不加载 Tiptap**，直接渲染 `contentHtml`，代码块的高亮与外壳由 `views/main/components/post/enhance-code-blocks.ts` 在渲染后重建。改编辑器扩展时要同步想清楚这三份输出各自受什么影响。

代码块因此有**两份 DOM 实现且不能合并**（后台必须是 Tiptap NodeView 才能承载可编辑区，前台不能引入 ProseMirror），但语法高亮、语言清单、语言图标、展示名、行数计算已统一收敛到 `composables/code-block/`——改外观要动两处 DOM，改逻辑只动一处。两个约束别破坏：`lowlight.ts` 刻意不从 barrel 导出（否则 lowlight 会被打进阅读端），`icons.generated.ts` 走动态 `import()` 懒加载（23 KB，没代码块的文章不该付这个钱）。图标表由 `bun run gen:icons` 生成，产物入库、构建不联网。

`pinned` 是另一个「单一转换边界」的例子：前端只传布尔，service 层翻译成 `pinnedAt` 时间戳，DTO 刻意不暴露 `pinnedAt`。

### 缓存

`utils/cache.ts` 的 `TTLCache` 是**进程内**缓存（单实例部署前提，多实例要换 Redis）。配置项、友链、文章各有一份，声明集中在 `daos/caches/`。TTL 只是防御性兜底，主逻辑靠 mutation 后主动 `invalidate*`——新增写路径时别忘了调用。

`view-counter.service.ts` 是例外：访问量在内存里累积，每 5s 批量落盘，进程退出前由 `SIGTERM`/`SIGINT` 处理器 flush；它**故意不触发缓存失效**，否则高频访问会让命中率归零。

### 站点配置是 KV 表

不是一列一个字段，而是 `config` 表里 4 个 key（`appearance` / `site_info` / `personal_info` / `smtp`，见 `db/constants/config.constants.ts`），`configValue` 存 JSON。每个 key 在 `dtos/config.dto.ts` 里有独立 DTO 定义结构，`isPublic` 控制未登录能否读取。加配置项 = 改对应 DTO，通常不需要迁移。

### 服务与静态资源模型

`src/index.ts` 的挂载顺序有意义：

1. SPA fallback 的 `onError` 注册在 `responsePlugin` **之前**——非 `/api` 路径 404 时返回 `index.html` 交给 Vue Router，`/api` 路径仍走 JSON 错误格式化
2. `/api/uploads` 静态目录开了 `decodeURI: true`（社交图标文件名可能含中文）
3. `/feed`、`/sitemap.xml` 在 `/api` 分组之外
4. `@elysiajs/openapi` 用 lazy import，仅非生产环境加载

### 运行时数据目录

`src/constants.ts` 定义的所有路径都基于 `process.cwd()/data/`：`data/.env`（首次启动自动生成，含随机 `JWT_SECRET`）、`data/sqlite/sqlite.db`、`data/uploads/{system,social,posts}/`、`data/logs/`。Docker 里这就是 `VOLUME ["/app/data"]`。

数据库迁移在 `db/connection.ts` 里**顶层 await 自动执行**（迁移目录 `process.cwd()/db/drizzle`），不需要手动跑 `db:migrate`；`build.ts` 会把 `db/drizzle` 复制到产物旁边。

### 前端主题与 i18n

- 主题色是**单一色相变量**驱动：`--app-hue`（0-360）经 OKLCH 推导出全部语义色（`src/css/tailwind.css`），Tailwind 侧只暴露 `bg`/`bg-muted`/`bg-card`/`fg`/`fg-muted`/`fg-subtle`/`fg-soft`/`border`/`accent` 这套语义 token。写样式请用这些 token，不要硬编码颜色
- `composables/theme.hook.ts` 是模块级单例；本地 localStorage 优先，只有用户从没设置过才拉服务端的 `appearance` 配置
- `composables/lang.hook.ts` 包装了 `t()`：`api.errors.*` 走 `tm()` + 属性名直查，因为这一段的 key 就是**后端返回的原始中文 message**（含 `.` 会被 vue-i18n 当路径解析）。加后端错误文案时，两份 locale 的 `api.errors` 下都要加对应条目

## 构建与发布

`scripts/build.ts <win|linux|linux-musl|mac>` 用 `Bun.build({ compile })` 产出单文件可执行程序，并复制 `db/drizzle` 和 `frontend-dist`（→ `public/`）。**前端产物必须先构建并放到 `ohmyblog-backend/frontend-dist/`**，否则只会打印警告然后产出一个没有前端的二进制。

图像处理用 Bun 1.3.14+ 内置的 `Bun.Image`（无 native 依赖，这是能编译成单文件、跑在 Alpine 上的前提）。Dockerfile 和 CI 都把 Bun 版本钉死在 `1.3.14`，升级前先确认这一点。

推 `v*` tag 触发 `.github/workflows/docker-publish.yml`：生成 Release notes（按 commit 前缀 feat/fix/ci/chore 分组）、构建四平台二进制、推 ghcr 镜像。

## 约定

- **注释、日志、面向用户的文案一律中文**；标识符用英文
- Commit message 走 Conventional Commits（`feat(post):` / `fix(editor):`），CI 的 changelog 分组依赖 `feat`/`fix`/`ci`/`chore` 前缀
- **提交要原子化**：一个提交只做一件事，各自能独立构建、独立回滚。一个功能通常拆成 `chore(deps)` 引依赖 → `feat` 主体 → `feat` 增量 → `fix` 修补（参见折叠块、前台 HTML 渲染那两组提交）。尤其别把 bug 修复埋进 `feat` 的正文——changelog 按前缀分组，那样它就从 fix 列表里消失了
- 格式化工具两边不同：后端 Biome（**tab 缩进**、双引号），前端 Prettier（默认 2 空格）。不要跨包套用
- 命名：后端 `*.route.ts` / `*.service.ts` / `*.dao.ts` / `*.dto.ts` / `*.cache.ts`；前端 `*.api.ts` / `*.store.ts` / `*.hook.ts` / `*.page.vue`
- 前端组件分层：`components/base/`（无业务的原子组件）→ `components/common/`（跨页面复用）→ `views/*/components/`（页面私有）。新组件先判断归属再落位
