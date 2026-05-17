// src/daos/friend-link.dao.ts
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { friendLink } from "../../db/schema";
import type { TFriendLinkQueryDTO } from "../dtos/friend-link.dto";
import { TTLCache } from "../utils/cache";

export type NewFriendLink = typeof friendLink.$inferInsert;
export type UpdateFriendLink = Partial<
	Omit<NewFriendLink, "uuid" | "createdAt">
>;

// 前台只展示 approved 列表，且条目数极少（< 100）变化频率低（管理员手动审批），
// 用单 key TTL 缓存即可。任何写操作都全量失效。
type FriendLinkRow = typeof friendLink.$inferSelect;
const APPROVED_CACHE_KEY = "approved";
const friendLinkCache = new TTLCache<string, FriendLinkRow[]>({
	ttlMs: 60_000,
	maxSize: 4,
});

class FriendLinkDao {
	/**
	 * 新增友链记录（申请或管理员直接添加）
	 */
	async create(data: NewFriendLink) {
		const result = await db.insert(friendLink).values(data).returning();
		friendLinkCache.clear();
		return result[0];
	}

	/**
	 * 分页查询友链列表（管理员），支持按状态筛选
	 */
	async findAll(options: TFriendLinkQueryDTO = {}) {
		const {
			page = 1,
			pageSize = 20,
			status,
		} = options as Required<TFriendLinkQueryDTO>;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (status) conditions.push(eq(friendLink.status, status));
		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [list, totalResult] = await Promise.all([
			db
				.select()
				.from(friendLink)
				.where(where)
				.orderBy(desc(friendLink.createdAt))
				.limit(pageSize)
				.offset(offset),
			db.select({ total: count() }).from(friendLink).where(where),
		]);

		return { list, total: totalResult[0].total };
	}

	/**
	 * 获取所有已审批通过的友链（前台展示用，带 60s 缓存）
	 */
	async findApproved() {
		const cached = friendLinkCache.get(APPROVED_CACHE_KEY);
		if (cached !== undefined) return cached;
		const list = await db
			.select()
			.from(friendLink)
			.where(eq(friendLink.status, "approved"))
			.orderBy(desc(friendLink.joinedAt));
		friendLinkCache.set(APPROVED_CACHE_KEY, list);
		return list;
	}

	/**
	 * 根据 UUID 查询单条记录
	 */
	async findById(uuid: string) {
		const result = await db
			.select()
			.from(friendLink)
			.where(eq(friendLink.uuid, uuid))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 更新友链字段
	 */
	async update(uuid: string, data: UpdateFriendLink) {
		const result = await db
			.update(friendLink)
			.set(data)
			.where(eq(friendLink.uuid, uuid))
			.returning();
		friendLinkCache.clear();
		return result[0] || null;
	}

	/**
	 * 删除友链
	 */
	async delete(uuid: string) {
		await db.delete(friendLink).where(eq(friendLink.uuid, uuid));
		friendLinkCache.clear();
	}

	/**
	 * 获取待审批友链数量（用于仪表盘统计）
	 */
	async countPending() {
		const result = await db
			.select({ total: count() })
			.from(friendLink)
			.where(eq(friendLink.status, "pending"));
		return result[0].total;
	}
}

export const friendLinkDao = new FriendLinkDao();
