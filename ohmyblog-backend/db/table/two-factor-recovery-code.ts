import { createId } from "@paralleldrive/cuid2";
import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const twoFactorRecoveryCode = sqliteTable("two_factor_recovery_code", {
	// 主键
	uuid: text("uuid")
		.primaryKey()
		.$defaultFn(() => createId()),

	// 关联用户
	userUuid: text("user_uuid").notNull(),

	// 恢复码的 SHA-256 摘要（十六进制）。明文只在生成那一刻返回给前端，不落库。
	//
	// 这里刻意不用 Bun.password.hash（argon2id）：
	//   1. 恢复码是服务端生成的高熵随机串，不存在弱口令字典攻击面，
	//      慢哈希带来的抗爆破收益为零；
	//   2. argon2 每条 hash 自带独立 salt，校验时只能把 N 条记录逐个 verify，
	//      10 条就是接近 1 秒的 CPU 占用；SHA-256 是确定性的，可以直接
	//      WHERE code_hash = ? 命中，O(1) 且无需遍历。
	codeHash: text("code_hash").notNull(),

	// 使用时间，null 表示未使用。恢复码一次性消费，用过即作废
	usedAt: integer("used_at", { mode: "timestamp" }),

	// 创建时间（同一批恢复码的时间相同，可用于区分批次）
	createdAt: integer("created_at", { mode: "timestamp" })
		.notNull()
		.default(sql`(unixepoch())`),
});
