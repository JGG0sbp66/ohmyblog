// src/daos/two-factor.dao.ts
//
// 两步验证恢复码的持久化层。
//
// 恢复码只存 SHA-256 摘要（见 db/table/two-factor-recovery-code.ts 里的说明），
// 所以校验是一次等值查询而不是遍历 verify。
//
// 标准使用顺序：
//   1. replaceAll(userUuid, hashes)        // 启用 / 重新生成：整批替换
//   2. findActiveByHash(userUuid, hash)    // 用户提交恢复码时校验
//   3. markAsUsedIfActive(uuid)            // 命中后立即作废，一次性消费
//   4. deleteByUser(userUuid)              // 关闭两步验证时清空
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../db/connection";
import { twoFactorRecoveryCode } from "../../db/schema";

class TwoFactorDao {
	/**
	 * 整批替换某个用户的恢复码。
	 *
	 * 走事务是因为「删旧」和「插新」必须一起成立：只删成功会让用户手里的
	 * 恢复码全部失效且库里空空，只插成功会让旧码继续有效。
	 * bun:sqlite 驱动是同步的，所以事务回调里用 .run() 而不是 await
	 * （drizzle 的 bun-sqlite transaction 本身也是同步签名）。
	 *
	 * @param userUuid 用户 UUID
	 * @param codeHashes 新恢复码的 SHA-256 摘要数组
	 */
	async replaceAll(userUuid: string, codeHashes: string[]) {
		db.transaction((tx) => {
			tx.delete(twoFactorRecoveryCode)
				.where(eq(twoFactorRecoveryCode.userUuid, userUuid))
				.run();

			// values([]) 在 drizzle 里会生成非法 SQL，空数组直接跳过插入
			if (codeHashes.length === 0) return;

			tx.insert(twoFactorRecoveryCode)
				.values(codeHashes.map((codeHash) => ({ userUuid, codeHash })))
				.run();
		});
	}

	/**
	 * 按摘要查找某个用户尚未使用的恢复码
	 * @param userUuid 用户 UUID
	 * @param codeHash 用户提交的恢复码的 SHA-256 摘要
	 * @returns 命中的记录或 null
	 */
	async findActiveByHash(userUuid: string, codeHash: string) {
		const result = await db
			.select()
			.from(twoFactorRecoveryCode)
			.where(
				and(
					eq(twoFactorRecoveryCode.userUuid, userUuid),
					eq(twoFactorRecoveryCode.codeHash, codeHash),
					isNull(twoFactorRecoveryCode.usedAt),
				),
			)
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 统计某个用户还剩多少个未使用的恢复码（设置页展示用）
	 * @param userUuid 用户 UUID
	 */
	async countActive(userUuid: string) {
		const result = await db
			.select({ uuid: twoFactorRecoveryCode.uuid })
			.from(twoFactorRecoveryCode)
			.where(
				and(
					eq(twoFactorRecoveryCode.userUuid, userUuid),
					isNull(twoFactorRecoveryCode.usedAt),
				),
			);
		return result.length;
	}

	/**
	 * 将指定恢复码标记为已使用
	 * @param uuid 恢复码记录 UUID
	 */
	/**
	 * 原子地作废一条恢复码：UPDATE 只在 usedAt 仍为空时生效。
	 *
	 * 「查后标记」拆成 findActiveByHash + markAsUsed 两步的话，并发提交
	 * 同一个码的两个请求会双双通过查询、先后标记 —— 一次性消费被击穿。
	 * 把判定并进 UPDATE 的 WHERE 里，数据库保证只有一个请求能改到行。
	 * 当前 bun:sqlite 驱动是同步的、实际不可能交错，这里是为换驱动 /
	 * 多实例部署预埋的正确性。
	 *
	 * @returns 是否真的作废了。false = 并发下已被别的请求用掉，调用方
	 *          应按「验证码无效」处理
	 */
	async markAsUsedIfActive(uuid: string): Promise<boolean> {
		const result = await db
			.update(twoFactorRecoveryCode)
			.set({ usedAt: new Date() })
			.where(
				and(
					eq(twoFactorRecoveryCode.uuid, uuid),
					isNull(twoFactorRecoveryCode.usedAt),
				),
			)
			.returning({ uuid: twoFactorRecoveryCode.uuid });
		return result.length > 0;
	}

	/**
	 * 清空某个用户的所有恢复码（关闭两步验证时调用）
	 * @param userUuid 用户 UUID
	 */
	async deleteByUser(userUuid: string) {
		await db
			.delete(twoFactorRecoveryCode)
			.where(eq(twoFactorRecoveryCode.userUuid, userUuid));
	}
}

export const twoFactorDao = new TwoFactorDao();
