import { appendFile } from "node:fs";
import { join } from "node:path";
import { consola } from "consola";
import Elysia from "elysia";
import { LOGS_DIR } from "../constants";

/**
 * 全局日志实例，使用 consola 默认配置
 */
export const logger = consola;

/**
 * 文件日志 Reporter
 *
 * 将 ERROR 和 FATAL 级别的日志持久化到 error.log 文件
 *
 */
consola.addReporter({
	log(logObj) {
		// 过滤：只记录严重错误，忽略 info/warn/success 等
		if (logObj.type !== "error" && logObj.type !== "fatal") return;

		try {
			// 1. 构建日志文件路径（例如：/app/logs/error.log）
			const logFile = join(LOGS_DIR, "error.log");

			// 2. 生成 ISO 8601 格式的时间戳（例如：2026-02-25T14:30:45.123Z）
			const timestamp = new Date().toISOString();

			// 3. 提取标签（如果有的话，格式化为 [标签] ）
			const tag = logObj.tag ? `[${logObj.tag}] ` : "";

			// 4. 格式化日志内容
			// 格式：[时间戳] [标签] 级别: JSON序列化的参数
			// 例如：[2026-02-25T14:30:45.123Z] [AuthService] ERROR: ["数据库错误",{"message":"...","stack":"..."}]
			const content = `[${timestamp}] ${tag}${logObj.type.toUpperCase()}: ${JSON.stringify(
				logObj.args,
				// 自定义序列化器：特殊处理 Error 对象
				// 因为 JSON.stringify(new Error("xxx")) 会返回 "{}"，丢失错误信息
				// 这里手动提取 message 和 stack，保留完整的错误堆栈
				(_, v: unknown) =>
					v instanceof Error ? { message: v.message, stack: v.stack } : v,
			)}\n`;

			// 5. 异步追加到文件末尾（不覆盖历史日志，不阻塞主线程）
			appendFile(logFile, content, (err) => {
				if (err && process.env.NODE_ENV === "development") {
					console.warn("Failed to write error log:", err);
				}
			});
		} catch (err) {
			// 只有同步代码（如 JSON.stringify 或 join）抛出的错误会在这里捕获
			if (process.env.NODE_ENV === "development") {
				console.warn("Log formatting error:", err);
			}
		}
	},
});

/**
 * 使用 WeakMap 存储每个请求的开始时间。
 * 当 Request 对象因请求结束被垃圾回收时，这里对应的 entry 会自动清理，避免内存泄漏。
 */
const requestTimings = new WeakMap<Request, number>();

/**
 * Elysia 请求日志插件
 * 记录每个 HTTP 请求的方法、路径、状态码和响应时间
 */
export const logPlugin = new Elysia({ name: "logPlugin" })
	// 阶段 1：请求到达时，记录高精度起始时间戳
	.onRequest(({ request }) => {
		requestTimings.set(request, performance.now());
	})
	// 阶段 2：请求处理完成（但在发送响应前）
	.onAfterHandle({ as: "global" }, ({ request, set, path }) => {
		const startTime = requestTimings.get(request);
		// 计算耗时：当前时间 - 起始时间
		const duration = startTime
			? ` (${(performance.now() - startTime).toFixed(2)}ms)`
			: "";
		
		// 获取状态码，如果没设则默认为 200
		const status = Number(set.status) || 200;
		const msg = `${request.method} ${path} -> ${status}${duration}`;

		// 根据状态码区分日志级别：400 及以上显示为警告(黄色)，以下显示为成功(绿色)
		if (status >= 400) {
			logger.warn(msg);
		} else {
			logger.success(msg);
		}

		// 处理完毕，手动清理 Map 中的引用，虽然 WeakMap 会自动回收，但手动删除更即时
		requestTimings.delete(request);
	})
	// 阶段 3：如果处理过程中发生代码错误（如 500 错误）
	.onError({ as: "global" }, ({ request, error, code, path }) => {
		// 记录详细的错误信息，包括错误堆栈
		logger.error({
			message: `${request.method} ${path}`,
			code,
			error,
		});

		// 错误发生后也需要清理时间戳记录
		requestTimings.delete(request);
	});