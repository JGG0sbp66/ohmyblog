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
bun run db:gen         # 改完 db/table/*.ts 后生成迁移 SQL（启动时自动 migrate，无需手动跑）
bun run db:studio      # Drizzle Studio
bun run reset-password # 带外重置密码：忘记密码又没配 SMTP 时的唯一自救途径
                       # 可选 --disable-2fa 一起关掉两步验证（验证器丢了时用）
                       # 实现是 src/index.ts 的子命令而非 scripts/ 脚本，
                       # 因为 build.ts 只编译 src/index.ts，scripts/ 进不了二进制。
                       # 部署后对应 ./ohmyblog reset-password，
                       # Docker 里 docker exec -it -u 10001 <容器> /app/ohmyblog reset-password
                       # （-u 10001 不能省：以 root 跑会让 SQLite 的 -wal/-shm 归 root，主程序随后写不动）
bun run email          # react-email 预览服务，调 src/templates/*.tsx 用
bun run build:linux    # 单文件编译，产物在 scripts/dist/<platform>/
bun run docker         # 多阶段镜像（build context 是仓库根）
```

前端（在 `ohmyblog-frontend/` 下执行）：

```bash
bun run dev            # Vite :5173，/api、/feed、/sitemap.xml、/robots.txt 代理到 :3000
bun run type-check     # vue-tsc --build；会同时检查 Eden 引入的后端类型链
bun run build          # type-check + build-only 并行；CI 和 Docker 使用这个完整门禁
bun run build-only     # 仅打包，不做类型检查；只适合单独排查 Vite 构建
bun run format         # prettier --write .
```

**没有任何测试。** 后端的 `test` 脚本是 `exit 1` 占位，前端没有测试脚本，仓库里也没有 `*.test.*` / `*.spec.*`。不要去找测试或假装能跑测试；验证靠 `type-check` + `lint` + 手跑。

### type-check 的跨端约定

`vue-tsc` 会顺着 `@server/app` 检查 Eden Treaty 的完整后端类型链，这是有意的跨端契约门禁，不是噪音。`tsconfig.app.json` 已接入后端的 `bun-types`，并为 React Email 模板使用 React JSX 环境；当前基线是 **零报错**。任何 `../ohmyblog-backend/**` 报错都要按真实类型错误处理，不要过滤路径、跳过检查或改回 `build-only`。

因为类型链会解析后端依赖，运行前端 `type-check` / `build` 前必须先在 `ohmyblog-backend/` 执行过 `bun install`。

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

`data/.env` 里的 `TRUST_PROXY` 是**前置反向代理的层数**而非布尔：`0`（默认）完全忽略 `X-Forwarded-For`，`1` 是一层 nginx / Caddy，`2` 是 CDN 再套一层 nginx。取的是 XFF 链条右端往左数第 n 段——代理是往客户端送来的值后面追加真实对端地址，所以最左边那段恒不可信。配错会导致所有按 IP 的判断取到错误的人，反向代理部署后记得设它。

### 前端主题与 i18n

- 主题色是**单一色相变量**驱动：`--app-hue`（0-360）经 OKLCH 推导出全部语义色（`src/css/tailwind.css`），Tailwind 侧只暴露 `bg`/`bg-muted`/`bg-card`/`fg`/`fg-muted`/`fg-subtle`/`fg-soft`/`border`/`accent` 这套语义 token。写样式请用这些 token，不要硬编码颜色
- `composables/theme.hook.ts` 是模块级单例；本地 localStorage 优先，只有用户从没设置过才拉服务端的 `appearance` 配置
- `composables/lang.hook.ts` 包装了 `t()`：`api.errors.*` 走 `tm()` + 属性名直查，因为这一段的 key 就是**后端返回的原始中文 message**（含 `.` 会被 vue-i18n 当路径解析）。加后端错误文案时，两份 locale 的 `api.errors` 下都要加对应条目

### 列表拖拽排序

`composables/list-drag.hook.ts` 是唯一实现（页脚分组、分组内链接各持一个实例，嵌套两层靠内层 `stopPropagation` 分流）。没有拖拽手柄按钮 —— 整张卡片都是握持区，三条约定容易踩：

- 列表项必须用**稳定 key**（`composables/stable-key.hook.ts` 的 WeakMap 发号）。下标做 key 时 Vue 只换内容不搬 DOM，让位动画无从计算，被拖的节点还会把内容甩给隔壁
- 跟手位移用 `translate` 独立属性、放大用 `scale`，**不要合并成 `transform`**：复合属性只能整条一起过渡，跟手就会被拖出橡皮筋般的延迟
- 项内控件按用途打标记：按钮套 `data-no-drag`（永不起拖），输入框套 `data-drag-hold`（按住 240ms 才起拖，直接拖仍是拖选文字）。触摸一律走长按激活，并在激活后用非 passive 的 `touchmove` + `preventDefault` 吃掉滚动
- 量位置一律用 `offsetTop` / `offsetHeight`（布局坐标）：不含 transform，量到的是静止槽位，既不受自身放大影响，也不受邻项让位动画和页面滚动干扰

## 构建与发布

`scripts/build.ts <win|linux|linux-musl|mac>` 用 `Bun.build({ compile })` 产出单文件可执行程序，并复制 `db/drizzle` 和 `frontend-dist`（→ `public/`）。**前端产物必须先构建并放到 `ohmyblog-backend/frontend-dist/`**，否则只会打印警告然后产出一个没有前端的二进制。

图像处理用 Bun 1.3.14+ 内置的 `Bun.Image`（无 native 依赖，这是能编译成单文件、跑在 Alpine 上的前提）。Dockerfile 和 CI 都把 Bun 版本钉死在 `1.4.0`（1.4 起运行时由 Rust 实现，升级大版本前先确认这一点）。

推 `v*` tag 触发 `.github/workflows/docker-publish.yml`：生成 Release notes（按 commit 前缀 feat/fix/ci/chore 分组）、构建四平台二进制、推 ghcr 镜像。

## 浏览器与移动端自测

仓库没有测试框架，交互类改动（拖拽、动画、手势）靠**遥控真实浏览器**验证。`tools/cdp.mjs` 是一个零依赖的极简 CDP 客户端（用 Bun 跑）：

```bash
bun tools/cdp.mjs launch http://localhost:5173/   # 独立临时 profile + 调试端口 9222
bun tools/cdp.mjs targets                          # 列出可连接页面
bun tools/cdp.mjs eval "document.title"            # 页面里求值（支持 await）
bun tools/cdp.mjs rect "[data-sortable-item]"      # 元素视口矩形
bun tools/cdp.mjs drag 400 693 400 866             # 按住—移动—松手，真实指针事件
bun tools/cdp.mjs press 400 693                    # 拆成三步，在拖拽**进行中**取样
bun tools/cdp.mjs touchdrag 206 520 206 662        # 长按 + 拖，验证移动端手势
bun tools/cdp.mjs shot out.png
```

几个必须知道的坑：

- **一定要用独立 `--user-data-dir`**。Helium / Chrome 已在运行时，同 profile 再启动只会把参数转交给已有进程，调试端口根本不会打开（`launch` 子命令已经这么做了）
- `Input.dispatchMouseEvent` 派发的是**可信事件**，和真人操作同一条路径。`Runtime.evaluate` 里 `new PointerEvent()` 是不可信事件，验证不了 pointer capture、`touch-action` 这类只对可信事件生效的行为
- `Input.dispatchTouchEvent` **不会触发页面滚动**（绕过了浏览器的手势识别）。要验证「轻扫该滚页面 / 拖拽该吃掉滚动」，在页面里挂 `window.addEventListener('touchmove', e => log(e.defaultPrevented))`，看 `preventDefault` 有没有被调用
- 后台标签页的 `setTimeout` 会被节流到秒级。拖拽结束后的清理定时器要多等一会儿再断言，否则会误判成「样式没清掉」
- 拖拽这类连续手势要**分步移动**（十几帧），一步跳到终点等于什么都没拖

移动端（安卓模拟器）：

```bash
adb devices
adb shell am start -a android.intent.action.VIEW -d http://<局域网IP>:5173/
adb forward tcp:9333 localabstract:chrome_devtools_remote
bun tools/cdp.mjs targets --port=9333
```

模拟器要用**局域网 IP**（不是 127.0.0.1）。`adb devices` 没有在线设备通常就是模拟器没开机，跳过移动端验证即可。

管理后台的页面需要登录，干净 profile 进不去 `/admin`。验证后台组件的办法是**开演示模式**：`ohmyblog-backend/data/.env` 里把 `DEMO_MODE` 改成 `true` 重启后端（命令行环境变量优先级更高，也可启动时直接带 `DEMO_MODE=true`），未登录游客会拿到虚拟管理员身份（`__demo__`，只读——所有写操作被后端拒绝），`/admin` 无需登录直接逛，**测完改回 false**。要验证写操作路径时这套不够用，再临时加一个 Vite 入口（`ohmyblog-frontend/xxx.html` + 一个只 `createApp` 挂目标组件的临时 `.ts`）绕开路由守卫，**测完删掉**。

`.kiro/hooks/session-brief.ps1` 是 agentSpawn 钩子（挂在 `.kiro/agents/ohmyblog.json`）：会话启动时跑一次上面这些探测，并把 CLAUDE.md 注入上下文一次（放钩子而不是 steering/resources，是因为后者每轮对话都会重新塞一遍）。`.kiro/` 不入库，这套属于本机配置。钩子脚本**必须是纯 ASCII**：Windows PowerShell 5.1 读无 BOM 的 `.ps1` 会按 GBK 解码，中文源码被搞坏后会静默截断脚本（症状是后面几行输出凭空消失）。

## 约定

- **注释、日志、面向用户的文案一律中文**；标识符用英文
- Commit message 走 Conventional Commits（`feat(post):` / `fix(editor):`），CI 的 changelog 分组依赖 `feat`/`fix`/`ci`/`chore` 前缀
- **提交要原子化**：一个提交只做一件事，各自能独立构建、独立回滚。一个功能通常拆成 `chore(deps)` 引依赖 → `feat` 主体 → `feat` 增量 → `fix` 修补（参见折叠块、前台 HTML 渲染那两组提交）。尤其别把 bug 修复埋进 `feat` 的正文——changelog 按前缀分组，那样它就从 fix 列表里消失了
- 格式化工具两边不同：后端 Biome（**tab 缩进**、双引号），前端 Prettier（默认 2 空格）。不要跨包套用
- 命名：后端 `*.route.ts` / `*.service.ts` / `*.dao.ts` / `*.dto.ts` / `*.cache.ts`；前端 `*.api.ts` / `*.store.ts` / `*.hook.ts` / `*.page.vue`
- 前端组件分层：`components/base/`（无业务的原子组件）→ `components/common/`（跨页面复用）→ `views/*/components/`（页面私有）。新组件先判断归属再落位

## 安全约定

**防"猜"类攻击只能靠尝试次数上限，不能靠有效期。** 有效期限制的是一个凭证
能活多久，限制不了每秒能猜多少次——TOTP 每 30 秒轮换，但爆破者是在报随机
数字，轮换不削弱他的命中率。已落地的两处参考实现：
`db/constants/email-verification.constants.ts`（重置密码：单码失败上限 +
发信冷却 + 小时配额）和 `src/utils/two-factor-challenge.ts`。

**惩罚要落在正确的维度上。** 按账号做"锁定 N 分钟"是危险的：用户名在站点上
公开，等于给游客一个把管理员锁死的开关。按 IP 则要求 `TRUST_PROXY` 配置正确
才有意义。两步验证阶段可以按账号计，因为走到那一步必须先提交正确密码。

**失败路径的响应必须恒定。** 忘记密码接口的所有分支（邮箱不存在、被节流、
发信失败）都返回同一句提示，任何差异都会让它变成邮箱枚举器。
