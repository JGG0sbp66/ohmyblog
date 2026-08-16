import { Elysia } from "elysia";
import { logger } from "./logger.plugin";

const log = logger.withTag("ResponsePlugin");

// ---------------------------------------------
// 失败响应包装
// ---------------------------------------------
/**
 * 统一错误响应格式化
 * @param code Elysia 错误代码
 * @param error 框架或业务异常对象
 * @param set 响应控制对象，可设置状态码
 * @returns 统一格式的错误响应体
 */
// biome-ignore lint/suspicious/noExplicitAny: Elysia context is dynamically extended by plugins
const formatError = ({ code, error, set }: any) => {
	// 处理验证错误
	if (code === "VALIDATION") {
		// error.all 是一个包含所有错误详情的数组
		// 遍历它，只提取 "字段" 和 "错误信息"
		// biome-ignore lint/suspicious/noExplicitAny: Elysia validation error structure
		const formattedErrors = error.all.map((err: any) => {
			return {
				// err.path 通常是 "/password" 或 "/body/email"
				// 把开头的 "/" 去掉
				field: err.path.slice(1) || "unknown",
				// 优先使用 schema 中定义的自定义错误信息
				message: err.schema?.error || err.message,
			};
		});
		return {
			success: false,
			// data 里放详细的字段错误列表，方便前端在输入框底下标红
			// message 优先展示第一个具体的错误信息，提升前端 Toast 提示的友好度
			data: {
				message: formattedErrors[0]?.message || "请求参数验证失败",
				field: formattedErrors,
			},
		};
	}

	// 原生异常（DB 连不上、文件读不到、代码 bug……）没有 .status —— 它们是
	// 服务端故障，不是客户端错误。塌缩成 400 会让监控里 5xx 永远为零、排障
	// 方向被系统性误导；而且原生 message 可能带出连接串、路径等内部细节，
	// 不能下发，只进服务端日志。有 .status 的（BusinessError、Elysia 内建
	// 的 404/解析错误）照旧：状态码和 message 都是可对外的人话
	if (error.status == null) {
		log.error({ err: error }, "未处理的异常，已按 500 对外");
		set.status = 500;
		return {
			success: false,
			data: {
				message: "服务器内部错误",
			},
		};
	}

	set.status = error.status;
	return {
		success: false,
		data: {
			message: error.message,
		},
	};
};

// ---------------------------------------------
// 成功响应包装
// ---------------------------------------------
/**
 * 统一成功响应包装，避免重复包装已格式化对象
 * @param response 原始响应数据
 * @param set 响应控制对象，用于读取状态码
 * @returns 包装后的成功响应或透传原始响应
 */
// biome-ignore lint/suspicious/noExplicitAny: Elysia context is dynamically extended by plugins
const formatResponse = ({ response, set }: any) => {
	// 如果是错误响应，直接放行
	if (set.status >= 400) {
		return response;
	}

	// 特殊类型直接放行（文件流、BunFile/Blob 等）
	if (response instanceof Response || response instanceof Blob) return response;

	// 防止二次包装 (比如 onError 返回的已经是格式化好的对象)
	if (response && typeof response === "object" && "success" in response) {
		return response;
	}

	return {
		success: true,
		data: response,
	};
};

export const responsePlugin = new Elysia({ name: "responsePlugin" })
	.onError({ as: "global" }, formatError)
	.mapResponse({ as: "global" }, formatResponse);
