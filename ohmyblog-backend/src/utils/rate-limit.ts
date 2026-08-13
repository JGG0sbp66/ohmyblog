// src/utils/rate-limit.ts
//
// 两种最小限流器，都是进程内状态（多实例部署要换 Redis，与 utils/cache.ts
// 的结论一致）。
//
//   固定窗口计数：窗口内最多 N 次，用于登录这类「人类不会高频重复」的操作
//   最小间隔：两次调用之间至少隔多久，用于压掉并发突刺
//
// 刻意不做「失败若干次就锁定」：锁定的键如果是账号，而用户名在站点上是公开
// 的，那等于给任何人一个把站长锁在门外的开关。这里的两种限制都只是拖慢，
// 不会把谁彻底挡住，等一会儿就自动恢复。

import { TTLCache } from "./cache";

/** 被限流时统一抛这句，前端 i18n 里有对应文案 */
export const RATE_LIMITED_MESSAGE = "请求过于频繁，请稍后再试";

export interface FixedWindowOptions {
	/** 窗口长度（毫秒） */
	windowMs: number;
	/** 单个窗口内允许的最大次数 */
	max: number;
	/** 最多跟踪多少个 key，超出按插入顺序淘汰 */
	maxKeys?: number;
}

/**
 * 固定窗口计数限流器。
 *
 * @param options 窗口长度与上限
 * @returns consume(key) —— 允许返回 true，超限返回 false
 */
export const createFixedWindowLimiter = ({
	windowMs,
	max,
	maxKeys = 1024,
}: FixedWindowOptions) => {
	const store = new TTLCache<string, { count: number }>({
		ttlMs: windowMs,
		maxSize: maxKeys,
	});

	return {
		/**
		 * 记一次调用并判断是否放行
		 * @param key 限流维度，例如 IP 或用户 UUID
		 */
		consume(key: string): boolean {
			const window = store.get(key);

			if (!window) {
				store.set(key, { count: 1 });
				return true;
			}

			// TTLCache 的 value 是引用，直接改计数。刻意不走 set() —— set 会
			// 顺带刷新 TTL，窗口会随每次请求不断后延，退化成「窗口内首次调用
			// 之后永远不放行」
			window.count += 1;
			return window.count <= max;
		},
	};
};

/**
 * 最小间隔限流器：距上次放行不足 intervalMs 时拒绝。
 *
 * 与固定窗口的区别是没有配额概念，只压速率，所以正常用户几乎感知不到
 * （人手输一次验证码本来就要好几秒），但并发爆破会被压到串行。
 *
 * @param intervalMs 两次放行之间的最小间隔
 * @param maxKeys 最多跟踪多少个 key
 * @returns consume(key) —— 允许返回 true，太快返回 false
 */
export const createIntervalLimiter = (intervalMs: number, maxKeys = 1024) => {
	const store = new TTLCache<string, true>({
		ttlMs: intervalMs,
		maxSize: maxKeys,
	});

	return {
		consume(key: string): boolean {
			if (store.get(key)) return false;
			store.set(key, true);
			return true;
		},
	};
};
