// src/daos/config.dao.ts
import { eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { config } from "../../db/schema";
import { configCache, invalidateConfig } from "./caches/config.cache";

export type NewConfig = typeof config.$inferInsert;
export type ConfigUpdate = Partial<
	Omit<NewConfig, "uuid" | "configKey" | "createdAt" | "updatedAt">
>;

class ConfigDao {
	/**
	 * 创建配置项
	 */
	async createConfig(item: NewConfig) {
		const result = await db.insert(config).values(item).returning();
		invalidateConfig(item.configKey);
		return result[0];
	}

	/**
	 * 更新指定键的配置, 支持部分字段更新（自动忽略 undefined）
	 */
	async updateByKey(configKey: string, data: ConfigUpdate) {
		const updateData = Object.fromEntries(
			Object.entries(data).filter(([_, v]) => v !== undefined),
		);
		if (Object.keys(updateData).length === 0) return null;

		const result = await db
			.update(config)
			.set(updateData)
			.where(eq(config.configKey, configKey))
			.returning();
		invalidateConfig(configKey);
		return result[0] || null;
	}

	/**
	 * 根据键名删除配置
	 */
	async deleteByKey(configKey: string) {
		const result = await db
			.delete(config)
			.where(eq(config.configKey, configKey))
			.returning();
		invalidateConfig(configKey);
		return result[0] || null;
	}

	/**
	 * 根据配置键名查找配置项（带 60s TTL 缓存）
	 */
	async findByKey(configKey: string) {
		return configCache.fetch(configKey, async () => {
			const result = await db
				.select()
				.from(config)
				.where(eq(config.configKey, configKey))
				.limit(1);
			return result[0] || null;
		});
	}
}
export const configDao = new ConfigDao();
