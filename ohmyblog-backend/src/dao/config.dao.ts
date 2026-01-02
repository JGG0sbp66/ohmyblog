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
     */
    async createConfig(item: NewConfig) {
        const result = await db.insert(config).values(item).returning();
        return result[0];
    }

    /**
     * 根据配置键名查找配置项
     */
    async findByKey(configKey: string) {
        const result = await db.select()
            .from(config)
            .where(eq(config.configKey, configKey))
            .limit(1);
        return result[0] || null;
    }

    /**
     * 列出配置，可按是否公开过滤
     */
    async listConfigs(options?: { isPublic?: boolean }) {
        const { isPublic } = options ?? {};

        const query = isPublic === undefined
            ? db.select().from(config)
            : db.select().from(config).where(eq(config.isPublic, isPublic));

        const rows = await query;
        return rows;
    }

    /**
     * 列出所有公开配置
     */
    async listPublicConfigs() {
        return await this.listConfigs({ isPublic: true });
    }

    /**
     * 更新指定键的配置
     */
    async updateByKey(configKey: string, data: ConfigUpdate) {
        const result = await db.update(config)
            .set(data)
            .where(eq(config.configKey, configKey))
            .returning();
        return result[0] || null;
    }

    /**
     * 根据键名删除配置
     */
    async deleteByKey(configKey: string) {
        const result = await db.delete(config)
            .where(eq(config.configKey, configKey))
            .returning();
        return result[0] || null;
    }
}
export const configDao = new ConfigDao();
