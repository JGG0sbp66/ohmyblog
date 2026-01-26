export interface BusinessErrorOptions {
	status?: number;
	silent?: boolean;
}

/**
 * 业务可预期异常
 * - status: HTTP 状态码，用于响应
 * - silent: 是否静默，不写入 error 日志
 */
export class BusinessError extends Error {
	status: number;
	silent: boolean;

	constructor(message: string, options: BusinessErrorOptions = {}) {
		super(message);
		this.name = "BusinessError";
		this.status = options.status ?? 400;
		this.silent = options.silent ?? true;
	}
}
