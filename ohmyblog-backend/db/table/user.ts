import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { roles, statuses } from "../constants/user.constants";

export const user = sqliteTable("user", {
	// uuid: UUID 格式，在 SQLite 中存储为 text
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 用户名, 唯一，长度 50
	username: text("username").notNull().unique(),

	// 邮箱地址, 唯一，长度 100
	email: text("email").notNull().unique(),

	// 加密后的密码哈希, 长度 255
	passwordHash: text("password_hash").notNull(),

	// 用户角色: admin, user 等，默认 user
	role: text("role", { enum: roles }).default("user").notNull(),

	// 用户状态: active, inactive, banned 等，默认 inactive
	status: text("status", { enum: statuses }).default("inactive").notNull(),

	// 账户创建时间
	// mode: 'timestamp' 会自动将 JS Date 对象转为 SQLite 整数（Unix时间戳）
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`), // 数据库层面的默认值

	// 最后信息更新时间
	updatedAt: integer("updated_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date()),

	// 最后登录时间
	lastLoginAt: integer("last_login_at", { mode: "timestamp" }),

	// 最后登录 IP（用于异地登录检测）
	lastLoginIp: text("last_login_ip"),

	// 邮箱验证状态: true/false
	// SQLite 没有布尔型，Drizzle 会用 0/1 自动映射
	emailVerified: integer("email_verified", { mode: "boolean" }).default(false),

	// 是否已启用两步验证（TOTP）
	twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" })
		.notNull()
		.default(false),

	// TOTP 密钥（base32 编码）。
	// null 表示从未生成过；有值但 twoFactorEnabled 为 false，说明用户走到绑定
	// 流程中途就退出了 —— 下次点「启用」会覆盖成新的，不复用旧密钥。
	twoFactorSecret: text("two_factor_secret"),

	// 两步验证的启用时间，用于设置页展示「已于 X 启用」
	twoFactorEnabledAt: integer("two_factor_enabled_at", { mode: "timestamp" }),

	// 最近一次成功校验的 TOTP 时间步计数器。
	// RFC 6238 §5.2 要求验证码一次性使用：校验时强制 counter 必须大于此值，
	// 否则同一个 6 位码在它 30s 的有效期内可以被重复提交（例如被中间人截获后重放）。
	twoFactorLastUsedCounter: integer("two_factor_last_used_counter"),
});
