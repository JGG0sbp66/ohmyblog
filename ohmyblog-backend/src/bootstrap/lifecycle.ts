// src/bootstrap/lifecycle.ts
// 进程生命周期：后台任务启停、优雅关闭与启动横幅。

import { config } from "../env";
import { viewCounterService } from "../services/view-counter.service.js";
import { isDemo, isProduction } from "../utils/runtime";
import type { App } from "./app";

/**
 * 启动后台任务并注册优雅关闭钩子
 * （viewCounter 每 5s 把内存累积的访问量批量写回数据库，
 * 容器停止 / 本地 Ctrl+C 时把剩余计数落盘后再退出）
 */
export function startLifecycle(): void {
	viewCounterService.start();

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
}

/** 监听成功后打印启动横幅（端口、文档地址、演示模式提示） */
export function printStartupBanner(app: App): void {
	if (!app.server) {
		throw new Error("Server failed to start");
	}

	const { port } = app.server;
	const baseUrl = `http://localhost:${port}`;

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
}
