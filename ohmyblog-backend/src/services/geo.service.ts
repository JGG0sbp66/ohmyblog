// src/services/geo.service.ts
//
// 通过外部 API 解析 IP 的地理位置（国家/城市），用于异地登录检测。
//
// 1. 使用 ip-api.com
// 2. 内置 1 小时内存缓存：登录场景中同一 IP 在短时间内反复查询是常见情况，缓存能避免触发限流
// 3. 所有外部依赖（网络、解析）失败一律降级为「未知」并返回，不向上层抛错。
// 4. 本地/保留 IP 直接跳过外部请求（开发环境登录看到的多是 ::1 / 192.168.x.x）
import { logger } from "../plugins/logger.plugin";

export interface GeoInfo {
	/** 两位国家代码，如 CN / US；解析失败时为 null */
	country: string | null;
	/** 国家中文名（ip-api.com 提供 lang=zh-CN） */
	countryName: string | null;
	/** 城市名 */
	city: string | null;
	/** 是否成功解析 */
	ok: boolean;
}

interface IpApiResponse {
	status: "success" | "fail";
	country?: string;
	countryCode?: string;
	city?: string;
	query?: string;
	message?: string;
}

const UNKNOWN_GEO: GeoInfo = {
	country: null,
	countryName: null,
	city: null,
	ok: false,
};

class GeoService {
	private logger = logger.withTag("GeoService");
	/** IP -> GeoInfo 缓存，避免短时间内对同一 IP 反复调用外部 API */
	private cache = new Map<string, { info: GeoInfo; expiresAt: number }>();
	private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时

	/**
	 * 解析 IP 的地理位置信息
	 * 使用免费 API: http://ip-api.com/json
	 * 失败时返回 ok=false 的占位结果，调用方应优雅降级
	 */
	async lookup(ip: string): Promise<GeoInfo> {
		// 本地/保留 IP 直接返回未知
		if (this.isLocalOrReserved(ip)) {
			return UNKNOWN_GEO;
		}

		// 命中缓存
		const cached = this.cache.get(ip);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.info;
		}

		try {
			const url = `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,city,query&lang=zh-CN`;
			const res = await fetch(url, {
				signal: AbortSignal.timeout(5000),
			});
			if (!res.ok) {
				this.logger.warn({ ip, status: res.status }, "IP geo 查询 HTTP 异常");
				return UNKNOWN_GEO;
			}
			const data = (await res.json()) as IpApiResponse;
			if (data.status !== "success") {
				this.logger.warn({ ip, message: data.message }, "IP geo 查询失败");
				return UNKNOWN_GEO;
			}
			const info: GeoInfo = {
				country: data.countryCode ?? null,
				countryName: data.country ?? null,
				city: data.city ?? null,
				ok: true,
			};
			this.cache.set(ip, {
				info,
				expiresAt: Date.now() + this.CACHE_TTL_MS,
			});
			return info;
		} catch (err) {
			this.logger.warn({ ip, err }, "IP geo 查询异常");
			return UNKNOWN_GEO;
		}
	}

	/**
	 * 判断是否为本地或 RFC1918 保留内网地址。
	 * 这类 IP 调用外部 API 总是返回失败，提前拦截可以：
	 *   - 减少一次不必要的网络请求
	 *   - 避免占用外部 API 限流额度
	 *   - 开发环境不会在日志里打出大量 warning
	 */
	private isLocalOrReserved(ip: string): boolean {
		if (!ip || ip === "unknown") return true;
		// IPv4/IPv6 loopback
		if (ip === "::1" || ip === "127.0.0.1") return true;
		// RFC1918 private ranges
		if (ip.startsWith("10.")) return true;
		if (ip.startsWith("192.168.")) return true;
		// 172.16.0.0 ~ 172.31.255.255
		if (ip.startsWith("172.")) {
			const second = Number(ip.split(".")[1]);
			if (second >= 16 && second <= 31) return true;
		}
		// IPv6 链路本地
		if (ip.startsWith("fe80:")) return true;
		return false;
	}

	/**
	 * 格式化地理位置信息为可读字符串（例如 "中国 / 上海"）
	 * @param geo 地理位置信息对象
	 * @returns 格式化后的字符串，解析失败或为空时返回 "未知"
	 */
	formatLocation(geo: Partial<GeoInfo> | null | undefined): string {
		if (!geo) return "未知";
		return [geo.countryName, geo.city].filter(Boolean).join(" / ") || "未知";
	}
}

export const geoService = new GeoService();
