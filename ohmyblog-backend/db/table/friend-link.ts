import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { friendLinkStatuses } from "../constants/friend-link.constants";

export const friendLink = sqliteTable("friend_link", {
	// 主键
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 站点名称
	name: text("name").notNull(),

	// 站点 URL
	url: text("url").notNull(),

	// 站点图标 URL（填写链接，不上传）
	avatarUrl: text("avatar_url"),

	// 站点简介
	description: text("description"),

	// 标签列表（JSON 字符串数组）
	tags: text("tags", { mode: "json" }).$type<string[]>(),

	// 审批状态：pending / approved / rejected
	status: text("status", { enum: friendLinkStatuses })
		.notNull()
		.default("pending"),

	// 拒绝原因（仅 rejected 时填写）
	rejectReason: text("reject_reason"),

	// 入驻时间（审批通过时自动写入，管理员也可手动修改）
	joinedAt: integer("joined_at", { mode: "timestamp" }),

	// 申请时间
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),

	// 最后更新时间
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

/** 友链推断类型 */
export type TFriendLink = typeof friendLink.$inferSelect;
