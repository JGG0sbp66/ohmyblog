// src/daos/email-log.dao.ts
import { and, count, desc, eq } from "drizzle-orm";
import type { TEmailLogQueryDTO } from "../dtos/email.dto";
import { db } from "../../db/connection";
import { emailLog } from "../../db/schema";

export type NewEmailLog = typeof emailLog.$inferInsert;

class EmailLogDao {
	/**
	 * 写入一条邮件发送记录
	 * @param data 邮件日志实体
	 * @returns 插入后的记录
	 */
	async create(data: NewEmailLog) {
		const result = await db.insert(emailLog).values(data).returning();
		return result[0];
	}

	/**
	 * 分页查询邮件日志，支持按类型、状态过滤，按时间倒序
	 * @param options 分页与过滤参数
	 * @returns { list, total }
	 */
	async findAll(options: TEmailLogQueryDTO = {}) {
		const { page, pageSize, type, status, isRead } = options as Required<TEmailLogQueryDTO>;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (type) conditions.push(eq(emailLog.type, type));
		if (status) conditions.push(eq(emailLog.status, status));
		if (isRead !== undefined) conditions.push(eq(emailLog.isRead, isRead));
		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [list, totalResult] = await Promise.all([
			db
				.select()
				.from(emailLog)
				.where(where)
				.orderBy(desc(emailLog.createdAt))
				.limit(pageSize)
				.offset(offset),
			db.select({ total: count() }).from(emailLog).where(where),
		]);

		return { list, total: totalResult[0].total };
	}

	/**
	 * 根据 UUID 查询单条记录（用于预览重渲染）
	 * @param uuid 记录唯一标识
	 * @returns 记录或 null
	 */
	async findById(uuid: string) {
		const result = await db
			.select()
			.from(emailLog)
			.where(eq(emailLog.uuid, uuid))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 将邮件记录标记为已读
	 * @param uuid 记录唯一标识
	 */
	async markAsRead(uuid: string) {
		await db
			.update(emailLog)
			.set({ isRead: true })
			.where(eq(emailLog.uuid, uuid));
	}

	/**
	 * 将所有未读邮件记录标记为已读
	 */
	async markAllAsRead() {
		await db
			.update(emailLog)
			.set({ isRead: true })
			.where(eq(emailLog.isRead, false));
	}

	/**
	 * 获取未读邮件总数
	 */
	async countUnread() {
		const result = await db
			.select({ total: count() })
			.from(emailLog)
			.where(eq(emailLog.isRead, false));
		return result[0].total;
	}
}

export const emailLogDao = new EmailLogDao();
