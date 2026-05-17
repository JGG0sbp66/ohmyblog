<div align="center">
	<h1>ohmyblog 前端</h1>
	<p>面向读者与管理端的 Vue 3 应用，包含展示站点与后台管理。</p>
	<p>
		<img alt="Vue" src="https://img.shields.io/badge/Vue-3.5-42b883?style=flat&logo=vue.js&logoColor=white" />
		<img alt="Vite" src="https://img.shields.io/badge/Vite-7-646cff?style=flat&logo=vite&logoColor=white" />
		<img alt="Tailwind" src="https://img.shields.io/badge/Tailwind-4-38bdf8?style=flat&logo=tailwindcss&logoColor=white" />
		<img alt="Pinia" src="https://img.shields.io/badge/Pinia-3-f7d336?style=flat&logo=pinia&logoColor=1f2937" />
		<img alt="Bun" src="https://img.shields.io/badge/Bun-000000?style=flat&logo=bun&logoColor=white" />
	</p>
</div>

## ✨ 功能特性

### 🎨 前台体验

- [x] 主页 / 归档 / 友链 / 文章详情路由
- [x] 文章详情 Markdown 渲染
- [x] Header 搜索：关键词分页 + 无限滚动
- [x] 友链列表展示 + 申请表单

### 🧩 管理与内容

- [x] 登录 / 找回密码
- [x] 仪表盘、文章管理、邮件日志、友链管理、系统设置
- [x] 编辑器自动保存 + 手动保存
- [x] 标题自动生成 slug，支持手动覆盖
- [x] 文章状态切换：草稿 / 发布 / 归档 / 回收站
- [x] 封面图 / 行内图上传

### 🎛️ 外观与本地化

- [x] 主题模式：浅色 / 深色 / 跟随系统
- [x] 品牌色相调节（Hue 0-360）
- [x] 语言切换：zh-CN / en-US

### ⚙️ 初始化向导

- [x] 外观设置：主题模式 / 色相 / 语言
- [x] 站点信息：标题 / 页脚 / 备案
- [x] 管理员账号初始化
- [x] 个人信息与首页 Hero 配置
- [x] SMTP 配置与测试

## 🧰 技术栈

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

## 🚀 快速开始

### 安装依赖

```bash
bun install
```

### 启动开发服务器

```bash
bun run dev
```

应用将在 <http://localhost:5173> 启动（默认 Vite 端口）。

开发环境下，所有 `/api` 请求会自动代理到后端服务器 <http://localhost:3000>。

### 构建生产版本

```bash
bun run build
```

### 预览生产构建

```bash
bun run preview
```

## ⚡ 可用命令

| 命令                 | 说明                   |
| -------------------- | ---------------------- |
| `bun run dev`        | 开发模式（热重载）     |
| `bun run build`      | 构建生产版本           |
| `bun run build-only` | 仅构建（不做类型检查） |
| `bun run type-check` | 类型检查               |
| `bun run preview`    | 预览生产构建           |
| `bun run format`     | 代码格式化             |

## 🧩 开发说明

### 类型安全的 API 调用

项目使用 `@elysiajs/eden` 实现端到端类型安全，前端可以直接引用后端的类型定义：

```typescript
import type { App } from "@server/app";
import type { TRegisterDTO } from "@server/dtos";
import { treaty } from "@elysiajs/eden";

const api = treaty<App>("http://localhost:3000");
```

### 路径别名

- `@/`: 前端源码目录
- `@server/app`: 后端应用类型定义
- `@server/dtos`: 后端 DTO 类型
- `elysia`: 锁定与后端一致的 Elysia 版本
- `@sinclair/typebox`: 与后端共用的 TypeBox 依赖

### 开发代理

开发环境下，Vite 会将 `/api` 前缀的请求代理到后端服务器，避免跨域问题。

## 🧱 项目结构

```text
src/
├── api/             # API 请求封装
├── assets/          # 静态资源
├── components/      # Vue 组件
├── router/          # 路由配置
├── stores/          # Pinia 状态管理
├── views/           # 页面视图
├── i18n/            # 国际化配置
└── App.vue          # 根组件
```

## ✅ 环境要求

- Node.js: ^20.19.0 或 >=22.12.0
- Bun: 最新版本
