# ohmyblog 前端

基于 Vue 3 + Vite + Tailwind CSS 4 构建的博客系统前端应用。

## 技术栈

- **运行时**: [Bun](https://bun.sh/)
- **框架**: [Vue 3.5](https://vuejs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **状态管理**: [Pinia 3](https://pinia.vuejs.org/)
- **路由**: [Vue Router](https://router.vuejs.org/)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **类型安全 API**: [@elysiajs/eden](https://elysiajs.com/eden/overview.html)
- **国际化**: [Vue I18n](https://vue-i18n.intlify.dev/)
- **图标**: [Lucide Vue](https://lucide.dev/) + [Remix Icon](https://remixicon.com/)
- **动画**: [@formkit/auto-animate](https://auto-animate.formkit.com/)
- **工具库**: [@vueuse/core](https://vueuse.org/)

## 快速开始

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

应用将在 <http://localhost:5173> 启动（默认 Vite 端口）。

开发环境下，所有 `/api` 请求会自动代理到后端服务器 <http://localhost:3000。>

### 构建生产版本

```bash
bun run build
```

### 预览生产构建

```bash
bun run preview
```

## 可用命令

```bash
# 开发模式（带热重载）
bun run dev

# 构建生产版本
bun run build

# 仅构建（不进行类型检查）
bun run build-only

# 类型检查
bun run type-check

# 预览生产构建
bun run preview

# 代码格式化
bun run format
```

## 项目特性

### 类型安全的 API 调用

项目使用 `@elysiajs/eden` 实现端到端类型安全，前端可以直接引用后端的类型定义：

```typescript
// 通过别名引用后端类型
import type { App } from "@server/app";
import type { TRegisterDTO } from "@server/dtos";

// Eden Treaty 提供完整的类型推导
const api = treaty<App>("http://localhost:3000");
```

### 路径别名

项目配置了以下路径别名：

- `@/`: 前端源码目录
- `@server/app`: 后端应用类型定义
- `@server/dtos`: 后端 DTO 类型
- `elysia`: 锁定与后端一致的 Elysia 版本
- `@sinclair/typebox`: 与后端共用的 TypeBox 依赖

### 开发代理

开发环境下，Vite 会将 `/api` 前缀的请求代理到后端服务器，避免跨域问题。

## 项目结构

```text
src/
├── assets/          # 静态资源
├── components/      # Vue 组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── views/           # 页面视图
├── i18n/            # 国际化配置
└── App.vue          # 根组件
```

## 环境要求

- Node.js: ^20.19.0 或 >=22.12.0
- Bun: 最新版本

## 开发注意事项

1. 确保后端服务已启动（默认端口 3000）
2. 前端开发服务器会自动代理 API 请求到后端
3. 使用 Eden Treaty 时可获得完整的类型提示和自动补全
