import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { postStatuses } from "../constants/post.constants";

export const post = sqliteTable("post", {
	// 文章唯一标识
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 文章标题
	title: text("title").notNull().default(""),

	// 【管理端专用】编辑器源数据：ProseMirror JSON 格式
	// 保存了所有富文本细节（如图片宽高、块级自定义属性），是后台编辑器的唯一数据来源，
	// 也是前台文章渲染的输入（只读 Tiptap 实例直接 setContent(json)）
	content: text("content", { mode: "json" }),

	// 【搜索/预览专用】纯文本摘要
	// 由前端 editor.getText() 导出。用于数据库全文搜索 (FTS) 和文章列表的预览文字
	contentText: text("content_text"),

	// 封面图 URL
	coverImage: text("cover_image"),

	// 文章状态:
	//   draft     - 草稿（默认）
	//   published - 已发布
	//   archived  - 已归档（不再公开展示但保留）
	//   deleted   - 已移入回收站（软删除，可恢复）
	status: text("status", { enum: postStatuses }).notNull().default("draft"),

	// 标签列表，存储为 JSON 字符串数组，如 ["Vue", "TypeScript"]
	tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),

	// URL slug，唯一，用于 SEO 友好链接，如 /posts/my-first-post
	slug: text("slug").unique(),

	// 手动摘要，优先展示；未填则取 contentText 前 N 字
	excerpt: text("excerpt"),

	// 观看人数，前台每次访问时自增，默认为 0
	viewCount: integer("view_count").notNull().default(0),

	// 置顶时间：null 表示未置顶，非空表示已置顶。
	// 一个字段同时承担两个职责：
	//   - 是否置顶 → 判空（null / 非 null）
	//   - 多篇置顶间排序 → 按此时间倒序（最近置顶的排最前）
	// 前台已发布列表中，置顶文章排在普通文章之前。
	pinnedAt: integer("pinned_at", { mode: "timestamp" }),

	// 发布时间，仅 status 为 published 时有值
	publishedAt: integer("published_at", { mode: "timestamp" }),

	// 移入回收站时间，仅 status 为 deleted 时有值
	deletedAt: integer("deleted_at", { mode: "timestamp" }),

	// 创建时间
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),

	// 最后更新时间
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),
});

export type TPost = typeof post.$inferSelect;
