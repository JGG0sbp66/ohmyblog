// src/daos/email-verification.dao.ts
//
// 邮件验证码（如「忘记密码」6 位 OTP）的持久化层。
//
// 标准使用顺序：
//   1. invalidateByUser(userUuid, type)  // 作废该用户该类型的所有旧码
//   2. create({...})                      // 写入新码
//   3. (用户提交后) findActiveByCode(code, type) // 校验并取出
//   4. markAsUsed(uuid)                   // 流程完成后立即标记已用，防止重放
//
// 步骤 1 不可省略：否则同一用户可能同时存在多条「未使用 + 未过期」的记录，
// 攻击者只要拿到任意一条就能完成重置。
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "../../db/connection";
import type { TEmailVerificationType } from "../../db/constants/email-verification.constants";
import { emailVerification } from "../../db/schema";

export type NewEmailVerification = typeof emailVerification.$inferInsert;

class EmailVerificationDao {
	/**
	 * 创建验证码记录。
	 * ⚠️ 调用前必须先调用 `invalidateByUser` 作废同用户同类型的旧记录，
	 * 否则会同时存在多条有效 code，存在重放风险。
	 * @param data 验证码实体
	 * @returns 插入后的记录
	 */
	async create(data: NewEmailVerification) {
		const result = await db.insert(emailVerification).values(data).returning();
		return result[0];
	}

	/**
	 * 查询指定用户、指定类型的有效验证码（未使用且未过期）
	 * @param userUuid 用户 UUID
	 * @param type 验证码类型
	 * @returns 有效记录或 null
	 */
	async findActive(userUuid: string, type: TEmailVerificationType) {
		const now = new Date();
		const result = await db
			.select()
			.from(emailVerification)
			.where(
				and(
					eq(emailVerification.userUuid, userUuid),
					eq(emailVerification.type, type),
					isNull(emailVerification.usedAt),
					gt(emailVerification.expiresAt, now),
				),
			)
			.orderBy(emailVerification.createdAt)
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 根据 code + type 查询有效记录（用户提交验证码时校验）
	 * @param code 用户提交的验证码
	 * @param type 验证码类型
	 * @returns 有效记录或 null
	 */
	async findActiveByCode(code: string, type: TEmailVerificationType) {
		const now = new Date();
		const result = await db
			.select()
			.from(emailVerification)
			.where(
				and(
					eq(emailVerification.code, code),
					eq(emailVerification.type, type),
					isNull(emailVerification.usedAt),
					gt(emailVerification.expiresAt, now),
				),
			)
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 将指定用户、指定类型的所有未使用记录标记为已使用（发新码前作废旧码）
	 * @param userUuid 用户 UUID
	 * @param type 验证码类型
	 */
	async invalidateByUser(userUuid: string, type: TEmailVerificationType) {
		await db
			.update(emailVerification)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(emailVerification.userUuid, userUuid),
					eq(emailVerification.type, type),
					isNull(emailVerification.usedAt),
				),
			);
	}

	/**
	 * 将指定记录标记为已使用
	 * @param uuid 验证码记录 UUID
	 */
	async markAsUsed(uuid: string) {
		await db
			.update(emailVerification)
			.set({ usedAt: new Date() })
			.where(eq(emailVerification.uuid, uuid));
	}
}

export const emailVerificationDao = new EmailVerificationDao();
