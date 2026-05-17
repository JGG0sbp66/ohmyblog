// src/daos/config.dao.ts
import { eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { config } from "../../db/schema";
import { TTLCache } from "../utils/cache";

export type NewConfig = typeof config.$inferInsert;
export type ConfigUpdate = Partial<
	Omit<NewConfig, "uuid" | "configKey" | "createdAt" | "updatedAt">
>;

// 配置项总数极少（site_info / appearance / smtp / personal_info 等不到 10 个），
// 但每次请求都查库会浪费 CPU。这里在 DAO 层加 60s TTL 缓存，
// 所有 mutation 路径（包括绕过 ConfigService 的 auth.service）都会触发失效。
type ConfigRow = typeof config.$inferSelect;
const configCache = new TTLCache<string, ConfigRow | null>({
	ttlMs: 60_000,
	maxSize: 64,
});

class ConfigDao {
	/**
	 * 创建配置项
	 * @param item 完整配置对象
	 * @returns 刚插入的配置记录
	 */
	async createConfig(item: NewConfig) {
		const result = await db.insert(config).values(item).returning();
		configCache.delete(item.configKey);
		return result[0];
	}

	/**
	 * 更新指定键的配置, 支持部分字段更新
	 * @param configKey 配置键名
	 * @param data 要更新的字段，自动忽略 undefined
	 * @returns 更新后的配置，若无变更则返回 null
	 */
	async updateByKey(configKey: string, data: ConfigUpdate) {
		// 过滤 undefined 字段
		const updateData = Object.fromEntries(
			Object.entries(data).filter(([_, v]) => v !== undefined),
		);

		if (Object.keys(updateData).length === 0) return null;

		const result = await db
			.update(config)
			.set(updateData)
			.where(eq(config.configKey, configKey))
			.returning();
		configCache.delete(configKey);
		return result[0] || null;
	}

	/**
	 * 根据键名删除配置
	 * @param configKey 配置键名
	 * @returns 删除的配置记录，未找到则返回 null
	 */
	async deleteByKey(configKey: string) {
		const result = await db
			.delete(config)
			.where(eq(config.configKey, configKey))
			.returning();
		configCache.delete(configKey);
		return result[0] || null;
	}

	/**
	 * 根据配置键名查找配置项（带 60s TTL 缓存）
	 * @param configKey 配置键名
	 * @returns 配置记录，未找到则返回 null
	 */
	async findByKey(configKey: string) {
		const cached = configCache.get(configKey);
		if (cached !== undefined) return cached;
		const result = await db
			.select()
			.from(config)
			.where(eq(config.configKey, configKey))
			.limit(1);
		const row = result[0] || null;
		configCache.set(configKey, row);
		return row;
	}
}
export const configDao = new ConfigDao();

