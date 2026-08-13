// src/utils/getClientIp.ts
//
// 取客户端 IP。核心原则：**默认不信任任何请求头**。
//
// X-Forwarded-For / X-Real-IP 都是普通的 HTTP 头，任何人都能随手伪造。
// 无条件读取它们会带来两个方向的问题：
//   - 顺向：按 IP 做的限流/风控全部失效，每个请求换一个假 IP 即可绕过；
//   - 逆向：伪造成站长的 IP，去触发针对站长的惩罚，或者污染异地登录告警。
//
// 所以是否读这些头由 TRUST_PROXY 决定，它表示前面有几层自己的代理。
// 详细语义见 env.ts 里该项的注释。

import { config } from "../env";

interface GetClientIpOptions {
	request: Request;
	// biome-ignore lint/suspicious/noExplicitAny: Elysia server type is dynamic
	server?: any;
}

/** 直连场景下的对端地址；拿不到时返回 null */
// biome-ignore lint/suspicious/noExplicitAny: Elysia server type is dynamic
const getDirectIp = (request: Request, server?: any): string | null => {
	// Bun/Elysia 的 server.requestIP 直接返回 SocketAddress
	const direct = server?.requestIP?.(request);
	return direct?.address ?? null;
};

/**
 * 从请求中提取客户端 IP。
 *
 * TRUST_PROXY = 0（默认）时只用 TCP 层的对端地址，完全忽略请求头。
 *
 * TRUST_PROXY = n > 0 时从 X-Forwarded-For 链条的**右端**往左数第 n 个。
 * 取右端而不是最左边，是因为代理是往已有值后面追加真实对端地址的，
 * 最左边那一段来自客户端、可以随意伪造；右边 n 段才是自己的代理写的。
 * 链条比 n 短说明代理层数配置和实际部署不一致，此时退回直连地址而不是
 * 将就取一个可能被伪造的值。
 *
 * @returns 客户端 IP 字符串，都获取不到则返回 "unknown"
 */
export function getClientIp({ request, server }: GetClientIpOptions): string {
	const hops = config.TRUST_PROXY;

	if (hops <= 0) {
		return getDirectIp(request, server) ?? "unknown";
	}

	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const chain = forwarded
			.split(",")
			.map((part) => part.trim())
			.filter(Boolean);

		// hops=1 取最后一段，hops=2 取倒数第二段，依此类推
		const candidate = chain[chain.length - hops];
		if (candidate) return candidate;
	}

	// 只有一层代理时，X-Real-IP 是 nginx 常用的等价写法，可以作为兜底。
	// 多层部署下它不携带层级信息、无法判断可信位置，因此不采用
	if (hops === 1) {
		const realIp = request.headers.get("x-real-ip")?.trim();
		if (realIp) return realIp;
	}

	return getDirectIp(request, server) ?? "unknown";
}
