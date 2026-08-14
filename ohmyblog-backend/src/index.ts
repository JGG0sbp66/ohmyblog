import { existsSync } from "node:fs";
import { join } from "node:path";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { PUBLIC_DIR, UPLOADS_DIR } from "./constants";
import { config } from "./env";
import { demoPlugin } from "./plugins/demo.plugin.js";
import { logPlugin } from "./plugins/logger.plugin.js";
import { responsePlugin } from "./plugins/response.plugin.js";
import { authRoute } from "./routes/auth.route.js";
import { captchaRoute } from "./routes/captcha.route.js";
import { configRoute } from "./routes/config.route.js";
import { emailRoute } from "./routes/email.route.js";
import { feedRoute } from "./routes/feed.route.js";
import { friendLinkRoute } from "./routes/friend-link.route.js";
import { healthRoute } from "./routes/health.route.js";
import { postRoute } from "./routes/post.route.js";
import { sitemapRoute } from "./routes/sitemap.route.js";
import { twoFactorRoute } from "./routes/two-factor.route.js";
import { uploadRoute } from "./routes/upload.route.js";
import { viewerRoute } from "./routes/viewer.route.js";
import { viewCounterService } from "./services/view-counter.service.js";
import { isDemo, isProduction } from "./utils/runtime";

// === 命令行子命令 ===
// 必须在建服务器之前处理，处理完直接退出，不监听端口。
//
// 做成主程序的子命令而不是 scripts/ 下的独立脚本，是因为 build.ts 的
// entrypoints 只有本文件，scripts/ 不会被编译进单文件产物；而二进制和
// Docker 部署里既没有源码也没有 bun，偏偏那才是最需要带外重置的场景。
const CLI_COMMANDS = new Set(["reset-password"]);
const commandIndex = process.argv.findIndex((arg) => CLI_COMMANDS.has(arg));

if (commandIndex !== -1) {
	const command = process.argv[commandIndex];
	const commandArgs = process.argv.slice(commandIndex + 1);

	try {
		if (command === "reset-password") {
			const { runResetPassword } = await import("./cli/reset-password");
			await runResetPassword(commandArgs);
		}
		process.exit(0);
	} catch (err) {
		console.error("✗ 命令执行失败：", err);
		process.exit(1);
	}
}

const app = new Elysia()
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
	.use(
		// 静态文件服务：提供上传的图片、头像、图标等资源访问
		staticPlugin({
			assets: UPLOADS_DIR,
			prefix: "/api/uploads",
			// 上传资源文件名可能含非 ASCII 字符（如中文平台名生成的社交图标），
			// 浏览器会对其做 percent 编码，需解码后再匹配磁盘文件，否则 404
			decodeURI: true,
		}),
	)
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
// GET / 显式处理，SPA 其余路由由上方 onError 兜底
if (existsSync(PUBLIC_DIR)) {
	const serveIndex = () => Bun.file(join(PUBLIC_DIR, "index.html"));
	app
		.get("/", serveIndex)
		.use(staticPlugin({ assets: PUBLIC_DIR, prefix: "/" }));
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

// 启动服务
app.listen(config.PORT);

// 启动后台 viewCount 累积器（每 5s 把内存累积的访问量批量写回数据库）
viewCounterService.start();

// 容器停止 / 本地 Ctrl+C 时，把剩余的 viewCount 落盘后再退出
const shutdown = async (signal: string) => {
	console.log(`\n收到 ${signal}，正在退出...`);
	try {
		await viewCounterService.stop();
	} catch (err) {
		console.error("viewCounterService.stop 失败：", err);
	}
	process.exit(0);
};
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

export type App = typeof app;

if (!app.server) {
	throw new Error("Server failed to start");
}

const { port } = app.server;
const protocol = "http";
const baseUrl = `${protocol}://localhost:${port}`;

console.log(`\n🚀 Server started in \x1b[33m${config.NODE_ENV}\x1b[0m mode`);
console.log(`➜  Local:   \x1b[36m${baseUrl}\x1b[0m`);
if (!isProduction()) {
	console.log(`➜  Docs:    \x1b[36m${baseUrl}/openapi\x1b[0m`);
}
if (isDemo()) {
	console.log(
		`\n⚠️  \x1b[33m演示模式已启用\x1b[0m：游客可只读浏览后台，写操作一律拒绝`,
	);
	console.log(`   （系统尚未初始化时该限制不生效，setup 向导照常可用）`);
}
console.log(`\nReady to accept requests...\n`);
