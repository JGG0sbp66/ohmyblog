import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      // 开发环境将 /api 前缀转发到后端 3000
      "/api": {
        target: "http://172.17.0.3:3000",
        changeOrigin: true,
      },
    },
  },
  plugins: [vue(), vueDevTools(), tailwindcss()],
  resolve: {
    alias: {
      // 前端源码别名
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // 仅类型输入，不打包后端
      "@server/app": fileURLToPath(
        new URL("../ohmyblog-backend/src/app.d.ts", import.meta.url),
      ),
      // 后端 DTO 类型（如 TRegisterDTO）
      "@server/dtos": fileURLToPath(
        new URL("../ohmyblog-backend/src/dtos", import.meta.url),
      ),
      // 锁定与后端一致的 Elysia 类型
      elysia: fileURLToPath(
        new URL("../ohmyblog-backend/node_modules/elysia", import.meta.url),
      ),
    },
  },
});
