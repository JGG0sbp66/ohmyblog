import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const config = sqliteTable("config", {
	// 配置项唯一标识 (UUID格式)
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 配置键名 (如 app.language)，设为唯一索引
	configKey: text("config_key").notNull().unique(),

	// 配置值 (JSONB 格式)
	configValue: text("config_value", { mode: "json" }).notNull(),

	// 配置项描述
	description: text("description"),

	// 是否公开 (true-前端读, false-仅后端)
	isPublic: integer("is_public", { mode: "boolean" }).default(true),

	// 创建时间
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),

	// 更新时间
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});
