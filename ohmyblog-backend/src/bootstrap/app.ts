// src/bootstrap/app.ts
// Elysia 应用装配：静态资源、全局插件、业务路由、SPA fallback、OpenAPI。
// 只负责"把应用拼出来"，不监听端口、不管生命周期（那是 index.ts 的事）。
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Elysia } from "elysia";
import { PUBLIC_DIR, UPLOADS_DIR } from "../constants";
import { demoPlugin } from "../plugins/demo.plugin.js";
import { logPlugin } from "../plugins/logger.plugin.js";
import { responsePlugin } from "../plugins/response.plugin.js";
import { authRoute } from "../routes/auth.route.js";
import { captchaRoute } from "../routes/captcha.route.js";
import { configRoute } from "../routes/config.route.js";
import { emailRoute } from "../routes/email.route.js";
import { feedRoute } from "../routes/feed.route.js";
import { friendLinkRoute } from "../routes/friend-link.route.js";
import { healthRoute } from "../routes/health.route.js";
import { postRoute } from "../routes/post.route.js";
import { sitemapRoute } from "../routes/sitemap.route.js";
import { twoFactorRoute } from "../routes/two-factor.route.js";
import { uploadRoute } from "../routes/upload.route.js";
import { viewerRoute } from "../routes/viewer.route.js";
import { isProduction } from "../utils/runtime";

// === Bun 原生静态目录路由（v1.4+）===
// 替代 @elysiajs/static 与自写读盘路由：运行时直接读磁盘流式响应，
// 无 Response 缓存、无启动快照，文件覆盖变大/启动后新增都能正确响应
// （staticPlugin 的 fileCache 曾因此返回截断内容，见 d1d566c9），
// 并原生处理 percent 解码、路径穿越防护与 ETag/304/Range。
const bunStaticRoutes = {
	// 上传资源目录由 env.ts 在启动时保证存在，可直接注册
	"/api/uploads/*": { dir: UPLOADS_DIR },
	// 前端构建产物仅生产镜像/二进制里存在（由 build 阶段注入），
	// 目录缺失时不能注册（Bun.serve 会报 ENOENT）
	...(existsSync(join(PUBLIC_DIR, "assets"))
		? { "/assets/*": { dir: join(PUBLIC_DIR, "assets") } }
		: {}),
};

/**
 * 组装完整的 Elysia 应用实例。
 * async 是因为 OpenAPI 插件用 lazy import（见函数尾部）
 */
export async function createApp() {
	const app = new Elysia({ serve: { routes: bunStaticRoutes } })
		// SPA fallback：注册在 responsePlugin 之前，优先处理前端路由的 NOT_FOUND
		// 非 /api 路径找不到路由时返回 index.html，让 Vue Router 接管
		// /api 路径仍走 formatError 返回 JSON 错误
		.onError({ as: "global" }, ({ code, request }) => {
			if (
				code === "NOT_FOUND" &&
				existsSync(PUBLIC_DIR) &&
				!new URL(request.url).pathname.startsWith("/api")
			) {
				return Bun.file(join(PUBLIC_DIR, "index.html"));
			}
		})
		// 挂载插件
		.use(logPlugin)
		.use(responsePlugin)
		// 演示模式写入闸门：必须在业务路由之前，且早于任何写 handler
		.use(demoPlugin)
		// 挂载路由
		.use(feedRoute)
		.use(sitemapRoute)
		.group("/api", (app) =>
			app
				.use(healthRoute)
				.use(authRoute)
				.use(captchaRoute)
				.use(configRoute)
				.use(emailRoute)
				.use(friendLinkRoute)
				.use(postRoute)
				.use(twoFactorRoute)
				.use(uploadRoute)
				.use(viewerRoute),
		);

	// 挂载前端静态资源（public/ 目录由 Docker build 阶段注入）
	// assets/ 由上方 bunStaticRoutes 的原生目录路由托管，此处只保留
	// GET / 的显式处理，SPA 其余路由由 onError 兜底
	if (existsSync(PUBLIC_DIR)) {
		app.get("/", () => Bun.file(join(PUBLIC_DIR, "index.html")));
	}

	// OpenAPI 文档：仅开发环境启用
	// 生产用 lazy import 避免把 @elysiajs/openapi 整个模块 evaluate 进常驻 JS 堆
	if (!isProduction()) {
		const { openapi } = await import("@elysiajs/openapi");
		app.use(
			openapi({
				enabled: true,
				documentation: {
					info: {
						title: "ohmyblog API",
						version: "1.0.0",
					},
				},
			}),
		);
	}

	return app;
}

// 供 Eden（前端 treaty）与 app.d.ts 使用的全量路由类型
export type App = Awaited<ReturnType<typeof createApp>>;
