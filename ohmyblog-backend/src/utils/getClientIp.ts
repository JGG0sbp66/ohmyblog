// src/utils/getClientIp.ts

interface GetClientIpOptions {
	request: Request;
	// biome-ignore lint/suspicious/noExplicitAny: Elysia server type is dynamic
	server?: any;
}

/**
 * 从请求中提取客户端 IP，按优先级查询：
 * 1. X-Forwarded-For 头（反向代理场景，取第一个）
 * 2. X-Real-IP 头（Nginx 等代理常用）
 * 3. server.requestIP() 直连场景
 *
 * @returns 客户端 IP 字符串，如果都获取不到则返回 "unknown"
 */
export function getClientIp({ request, server }: GetClientIpOptions): string {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		// X-Forwarded-For 可能是 "client, proxy1, proxy2"，取最左边那个
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) return realIp.trim();

	// Bun/Elysia 的 server.requestIP 直接返回 SocketAddress
	const direct = server?.requestIP?.(request);
	if (direct?.address) return direct.address;

	return "unknown";
}
