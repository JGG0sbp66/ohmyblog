import { Elysia } from "elysia";
import { config } from "./env";
import { responsePlugin } from "./plugins/response.js";
import { openapi } from '@elysiajs/openapi'
import { logPlugin } from "./plugins/logger.js";
import { healthRoute } from "./routes/healthRoute.js";
import { authRoute } from "./routes/authRoute.js";

const app = new Elysia()
  // 挂载插件
  .use(logPlugin)
  .use(responsePlugin)
  // 挂载路由
  .use(healthRoute)
  .use(authRoute)
  // OpenAPI 插件
  .use(openapi({
    documentation: {
      info: {
        title: 'ohmyblog API',
        version: '1.0.0',
      }
    }
  }))
  // 启动服务
  .listen(config.PORT as number);

const { port } = app.server!;
const protocol = 'http';
const baseUrl = `${protocol}://localhost:${port}`;

console.log(`➜  Local:   \x1b[36m${baseUrl}\x1b[0m`); // 青色链接
console.log(`➜  Docs:    \x1b[36m${baseUrl}/openapi\x1b[0m`); // 青色链接
console.log(`\nReady to accept requests...\n`);

console.warn("⚠️  正在使用 Elysia 修复版 (PR #1637)，记得关注 v1.4.20 正式版发布！");