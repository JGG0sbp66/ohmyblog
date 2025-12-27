import { Elysia } from "elysia";
import { responsePlugin } from "./plugins/response.js";
import { healthRoute } from "./routes/healthRoute.js";
import { openapi } from '@elysiajs/openapi'

const app = new Elysia()
  // OpenAPI 插件
  .use(openapi({
    documentation: {
      info: {
        title: 'ohmyblog API',
        version: '1.0.0',
      }
    }
  }))
  // 挂载插件
  .use(responsePlugin)
  // 挂载路由
  .use(healthRoute)
  // 启动服务
  .listen(3000);

const { port } = app.server!;
const protocol = 'http';
const baseUrl = `${protocol}://localhost:${port}`;

console.log(`➜  Local:   \x1b[36m${baseUrl}\x1b[0m`); // 青色链接
console.log(`➜  Docs:    \x1b[36m${baseUrl}/openapi\x1b[0m`); // 青色链接
console.log(`\nReady to accept requests...\n`);
