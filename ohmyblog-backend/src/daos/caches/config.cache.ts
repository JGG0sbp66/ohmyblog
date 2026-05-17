// src/daos/caches/config.cache.ts
//
// 配置项总数极少（site_info / appearance / smtp / personal_info 等不到 10 个），
// 但每次请求都查库会浪费 CPU。这里在 DAO 层加 60s TTL 缓存，
// 所有 mutation 路径（包括绕过 ConfigService 的 auth.service）都会触发失效。

import type { config } from "../../../db/schema";
import { TTLCache } from "../../utils/cache";

export type ConfigRow = typeof config.$inferSelect;

export const configCache = new TTLCache<string, ConfigRow | null>({
	ttlMs: 60_000,
	maxSize: 64,
});

/** 单 key 失效：configKey 维度足够细，不需要全清 */
export function invalidateConfig(configKey: string) {
	configCache.delete(configKey);
}
