import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { UPLOADS_DIR } from "./constants";
import { config } from "./env";
import { logPlugin } from "./plugins/logger.plugin.js";
import { responsePlugin } from "./plugins/response.plugin.js";
import { authRoute } from "./routes/auth.route.js";
import { configRoute } from "./routes/config.route.js";
import { emailRoute } from "./routes/email.route.js";
import { healthRoute } from "./routes/health.route.js";
import { friendLinkRoute } from "./routes/friend-link.route.js";
import { postRoute } from "./routes/post.route.js";
import { uploadRoute } from "./routes/upload.route.js";

const app = new Elysia()
	// OpenAPI 插件（生产环境禁用）
	.use(
		openapi({
			enabled: config.NODE_ENV !== "production",
			documentation: {
				info: {
					title: "ohmyblog API",
					version: "1.0.0",
				},
			},
		}),
	)
	// 挂载插件
	.use(logPlugin)
	.use(responsePlugin)
	.use(
		// 静态文件服务：提供上传的图片、头像、图标等资源访问
		staticPlugin({
			assets: UPLOADS_DIR,
			prefix: "/api/uploads",
		}),
	)
	// 挂载路由
	.group("/api", (app) =>
		app
			.use(healthRoute)
			.use(authRoute)
			.use(configRoute)
			.use(emailRoute)
			.use(friendLinkRoute)
			.use(postRoute)
			.use(uploadRoute),
	)
	// 启动服务
	.listen(config.PORT);

export type App = typeof app;

if (!app.server) {
	throw new Error("Server failed to start");
}

const { port } = app.server;
const protocol = "http";
const baseUrl = `${protocol}://localhost:${port}`;

console.log(`\n🚀 Server started in \x1b[33m${config.NODE_ENV}\x1b[0m mode`);
console.log(`➜  Local:   \x1b[36m${baseUrl}\x1b[0m`);
if (config.NODE_ENV !== "production") {
	console.log(`➜  Docs:    \x1b[36m${baseUrl}/openapi\x1b[0m`);
}
console.log(`\nReady to accept requests...\n`);
