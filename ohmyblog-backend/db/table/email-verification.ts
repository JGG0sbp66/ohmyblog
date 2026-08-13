import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { emailVerificationTypes } from "../constants/email-verification.constants";

export const emailVerification = sqliteTable("email_verification", {
	// 主键
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 关联用户
	userUuid: text("user_uuid").notNull(),

	// 验证码用途类型，目前仅支持 reset_password
	type: text("type", { enum: emailVerificationTypes }).notNull(),

	// 6 位数字验证码
	code: text("code").notNull(),

	// 过期时间，见 RESET_PASSWORD_CODE_TTL_MIN
	expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),

	// 使用时间，null 表示未使用
	usedAt: integer("used_at", { mode: "timestamp" }),

	// 已失败的校验次数。达到 RESET_PASSWORD_MAX_ATTEMPTS 后该码立即作废
	// （写入 usedAt），必须重新申请 —— 没有这个上限，6 位码等于可以慢慢撞开
	attempts: integer("attempts").notNull().default(0),

	// 触发请求的 IP 地址
	ip: text("ip"),

	// 创建时间
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});
