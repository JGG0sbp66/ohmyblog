import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
	emailLogStatuses,
	emailLogTypes,
} from "../constants/email-log.constants";

export const emailLog = sqliteTable("email_log", {
	// 主键
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 邮件类型: smtp_test / login_alert / reset_password
	type: text("type", { enum: emailLogTypes }).notNull(),

	// 发件人名称（如: "no-reply"、站点名等）
	fromName: text("from_name").notNull().default(""),

	// 发件人邮箱
	fromEmail: text("from_email").notNull().default(""),

	// 收件人（单个邮箱或逗号分隔的多个邮箱）
	to: text("to").notNull(),

	// 邮件主题
	subject: text("subject").notNull(),

	// 发送状态: success / failed
	status: text("status", { enum: emailLogStatuses }).notNull(),

	// 失败时的错误信息
	errorMessage: text("error_message"),

	// 模板关键参数快照（JSON），用于后台展示和预览重渲染
	params: text("params", { mode: "json" }),

	// 发送时间
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});

/** 邮件日志推断类型（供前端使用） */
export type TEmailLog = typeof emailLog.$inferSelect;

