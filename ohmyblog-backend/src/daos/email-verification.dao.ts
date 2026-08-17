// src/daos/email-verification.dao.ts
//
// 邮件验证码（如「忘记密码」6 位 OTP）的持久化层。
//
// 标准使用顺序：
//   1. findActive(userUuid, type)         // 已有未过期的码则重发它，不要换新码
//   2. invalidateByUser(userUuid, type)   // 确实要发新码时，先作废所有旧码
//   3. create({...})                      // 写入新码
//   4. (用户提交后) findActiveByCode(code, type) // 校验并取出
//   5a. consumeForPasswordReset(...)       // 成功时事务内原子消费并更新密码
//   5b. incrementAttempts(uuid)            // 失败则累加，到上限后 markAsUsed
//
// 步骤 2 不可省略：否则同一用户可能同时存在多条「未使用 + 未过期」的记录，
// 攻击者只要拿到任意一条就能完成重置。
//
// 步骤 1 也不可省略：直接换新码会把 attempts 清零，
// RESET_PASSWORD_MAX_ATTEMPTS 就退化成靠反复申请即可绕过的软限制。
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import type { TEmailVerificationType } from "../../db/constants/email-verification.constants";
import { emailVerification, user } from "../../db/schema";

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
	 * 失败次数 +1，返回累加后的值。
	 *
	 * 用 SQL 里的 `attempts + 1` 而不是先读再写，避免并发提交时两个请求
	 * 读到同一个旧值、各自 +1 后互相覆盖，让上限被稀释成「并发数 × 上限」。
	 *
	 * @param uuid 验证码记录 UUID
	 * @returns 累加后的失败次数
	 */
	async incrementAttempts(uuid: string) {
		const result = await db
			.update(emailVerification)
			.set({ attempts: sql`${emailVerification.attempts} + 1` })
			.where(eq(emailVerification.uuid, uuid))
			.returning();
		return result[0]?.attempts ?? 0;
	}

	/**
	 * 重发已有验证码时刷新审计 ip —— 记录应指向「最近一次触发申请」的来源，
	 * 而不是永远停在第一次
	 * @param uuid 验证码记录 UUID
	 * @param ip 最新触发申请的来源 IP
	 */
	async updateIp(uuid: string, ip: string) {
		await db
			.update(emailVerification)
			.set({ ip })
			.where(eq(emailVerification.uuid, uuid));
	}

	/**
	 * 原子消费密码重置验证码并更新用户密码。
	 *
	 * 验证码消费使用包含记录 UUID、用户、类型、未使用和未过期条件的
	 * UPDATE ... RETURNING，确保并发请求只有一个能消费成功。密码更新与消费
	 * 位于同一事务；用户更新失败会抛错并回滚验证码消费。
	 *
	 * @returns true 表示消费并更新成功；false 表示验证码已无效或被并发消费
	 */
	async consumeForPasswordReset(
		uuid: string,
		userUuid: string,
		passwordHash: string,
	): Promise<boolean> {
		return db.transaction((tx) => {
			const now = new Date();
			const consumed = tx
				.update(emailVerification)
				.set({ usedAt: now })
				.where(
					and(
						eq(emailVerification.uuid, uuid),
						eq(emailVerification.userUuid, userUuid),
						eq(emailVerification.type, "reset_password"),
						isNull(emailVerification.usedAt),
						gt(emailVerification.expiresAt, now),
					),
				)
				.returning({ uuid: emailVerification.uuid })
				.all();

			if (consumed.length === 0) return false;

			const updated = tx
				.update(user)
				.set({ passwordHash })
				.where(eq(user.uuid, userUuid))
				.returning({ uuid: user.uuid })
				.all();
			if (updated.length === 0) {
				throw new Error("密码重置失败：用户不存在");
			}

			return true;
		});
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
