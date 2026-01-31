import { openapi } from "@elysiajs/openapi";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { config, UPLOADS_DIR } from "./env";
import { logPlugin } from "./plugins/logger.plugin.js";
import { responsePlugin } from "./plugins/response.plugin.js";
import { authRoute } from "./routes/auth.route.js";
import { configRoute } from "./routes/config.route.js";
import { healthRoute } from "./routes/health.route.js";

const app = new Elysia()
	// OpenAPI 插件
	.use(
		openapi({
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
		staticPlugin({
			// TODO: 接口文档关于读取静态文件的描述还非常简略，需要更新
			assets: UPLOADS_DIR,
			prefix: "/api/uploads",
		}),
	)
	// 挂载路由
	.group("/api", (app) => app.use(healthRoute).use(authRoute).use(configRoute))
	// 启动服务
	.listen(config.PORT as number);

export type App = typeof app;

if (!app.server) {
	throw new Error("Server failed to start");
}

const { port } = app.server;
const protocol = "http";
const baseUrl = `${protocol}://localhost:${port}`;

console.log(`➜  Local:   \x1b[36m${baseUrl}\x1b[0m`); // 青色链接
console.log(`➜  Docs:    \x1b[36m${baseUrl}/openapi\x1b[0m`); // 青色链接
console.log(`\nReady to accept requests...\n`);
