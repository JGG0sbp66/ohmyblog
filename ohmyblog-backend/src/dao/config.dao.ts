// src/dao/config.dao.ts
import { eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { config } from "../../db/schema";

export type NewConfig = typeof config.$inferInsert;
export type ConfigUpdate = Partial<
	Omit<NewConfig, "uuid" | "configKey" | "createdAt" | "updatedAt">
>;

class ConfigDao {
	/**
	 * 创建配置项
	 * @param item 完整配置对象
	 * @returns 刚插入的配置记录
	 */
	async createConfig(item: NewConfig) {
		const result = await db.insert(config).values(item).returning();
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
		return result[0] || null;
	}

	/**
	 * 根据配置键名查找配置项
	 * @param configKey 配置键名
	 * @returns 配置记录，未找到则返回 null
	 */
	async findByKey(configKey: string) {
		const result = await db
			.select()
			.from(config)
			.where(eq(config.configKey, configKey))
			.limit(1);
		return result[0] || null;
	}
}
export const configDao = new ConfigDao();
