// src/utils/cache.ts

/**
 * 进程内 TTL 缓存（无依赖，单实例）。
 *
 * 设计权衡：
 *   - 业务上 keys 数量很有限（config 不到 10 个、archive 一个、friends 一个、post slug 几十~几百）
 *     所以没引入 LRU 这类复杂结构，只用 Map + 可选 maxSize 兜底。
 *   - TTL 只是防御性兜底（怕代码漏改失效点），主动失效仍然走 invalidate。
 *   - 多实例部署需要换成 Redis；目前是单实例博客，进程内即可。
 */

interface Entry<V> {
	value: V;
	expireAt: number;
}

export interface TTLCacheOptions {
	/** 默认 TTL（毫秒），0 表示永不过期。默认 60s */
	ttlMs?: number;
	/** 最大条目数，超过时按插入顺序淘汰最早的。默认 1024 */
	maxSize?: number;
}

export class TTLCache<K, V> {
	private store = new Map<K, Entry<V>>();
	private readonly ttlMs: number;
	private readonly maxSize: number;

	constructor(opts: TTLCacheOptions = {}) {
		this.ttlMs = opts.ttlMs ?? 60_000;
		this.maxSize = opts.maxSize ?? 1024;
	}

	get(key: K): V | undefined {
		const entry = this.store.get(key);
		if (!entry) return undefined;
		if (entry.expireAt > 0 && entry.expireAt < Date.now()) {
			this.store.delete(key);
			return undefined;
		}
		return entry.value;
	}

	set(key: K, value: V, ttlMs: number = this.ttlMs): void {
		// 简单的容量兜底：满了就丢最早插入的（Map 保留插入顺序）
		if (this.store.size >= this.maxSize && !this.store.has(key)) {
			const oldest = this.store.keys().next().value;
			if (oldest !== undefined) this.store.delete(oldest);
		}
		const expireAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
		this.store.set(key, { value, expireAt });
	}

	delete(key: K): boolean {
		return this.store.delete(key);
	}

	clear(): void {
		this.store.clear();
	}

	/**
	 * 缓存未命中则调用 loader 取值并写入；命中直接返回。
	 * 注意：未对 loader 抛出做缓存（避免缓存穿透累积错误）。
	 */
	async fetch(key: K, loader: () => Promise<V>): Promise<V> {
		const cached = this.get(key);
		if (cached !== undefined) return cached;
		const fresh = await loader();
		this.set(key, fresh);
		return fresh;
	}

	/** 当前条目数（仅供调试 / 监控） */
	size(): number {
		return this.store.size;
	}
}
