import { join } from "node:path";
import { logger } from "@bogeychan/elysia-logger";
import { pino } from "pino";
import { LOGS_DIR } from "../constants";
import { BusinessError } from "./errors";

const logConfig = {
	level: "info",
	hooks: {
		/**
		 * 业务可预期异常不写入 error 日志（silent）
		 */
		logMethod(args: unknown[], method: (...a: unknown[]) => void) {
			const payload = args[0] as { err?: unknown; error?: unknown } | undefined;
			const err: unknown = payload?.err ?? payload?.error ?? payload;
			if (err instanceof BusinessError && err.silent) {
				return;
			}
			method.apply(this, args);
		},
	},
	transport: {
		targets: [
			// === 目标 1: 控制台输出 (开发用) ===
			{
				target: "pino-pretty",
				options: {
					colorize: true,
					translateTime: "SYS:standard",
					ignore: "pid,hostname",
				},
			},
			// === 目标 2: 文件输出 (只记录错误) ===
			{
				target: "pino/file",
				level: "error",
				options: {
					destination: join(LOGS_DIR, "error.log"),
					mkdir: true,
				},
			},
		],
	},
};

// 单独配置实例，当非http请求时也能使用
export const systemLogger = pino(logConfig);

// Elysia 日志插件
export const logPlugin = logger({ ...logConfig });
