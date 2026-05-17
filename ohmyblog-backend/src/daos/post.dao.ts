// src/daos/post.dao.ts
import { and, count, desc, eq, like, ne, or, sql, sum } from "drizzle-orm";
import { db } from "../../db/connection";
import { post } from "../../db/schema";
import type { TPostListQueryDTO } from "../dtos/post.dto";
import { TTLCache } from "../utils/cache";

export type NewPost = typeof post.$inferInsert;
export type PostUpdate = Partial<
	Omit<NewPost, "uuid" | "createdAt" | "updatedAt">
>;

// ───── 缓存 ─────────────────────────────────────────────────────────────────
// 文章详情按 slug 缓存（前台 GET /public/posts/:slug 是热路径）。
// archive 列表按单 key 缓存（仅返回标题/slug/日期/标签，体积小变化稀疏）。
//
// 失效策略：所有 mutation（update / permanentDelete）后调用 invalidatePostCaches。
// 注意：addViewCount 不需要失效——viewCount 在缓存里反正不准（异步累加），
// 等 TTL 过期或下一次 mutation 顺带刷新即可，避免互相抵消缓存收益。
type PublishedPostRow = {
	uuid: string;
	title: string;
	contentMarkdown: string | null;
	contentText: string | null;
	coverImage: string | null;
	tags: unknown;
	slug: string | null;
	excerpt: string | null;
	viewCount: number;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};
type ArchiveRow = {
	title: string;
	slug: string | null;
	publishedAt: Date | null;
	tags: unknown;
};
const slugCache = new TTLCache<string, PublishedPostRow | null>({
	ttlMs: 60_000,
	maxSize: 512,
});
const archiveCache = new TTLCache<string, ArchiveRow[]>({
	ttlMs: 60_000,
	maxSize: 4,
});
const ARCHIVE_KEY = "all";

function invalidatePostCaches() {
	slugCache.clear();
	archiveCache.clear();
}

// 列表场景下选取的字段：刻意排除 content (ProseMirror JSON) 和 contentMarkdown
// 因为这两个字段存储整篇文章数据，在列表接口中传输会造成不必要的性能损耗
const listColumns = {
	uuid: post.uuid,
	title: post.title,
	contentText: post.contentText,
	coverImage: post.coverImage,
	status: post.status,
	tags: post.tags,
	slug: post.slug,
	excerpt: post.excerpt,
	viewCount: post.viewCount,
	publishedAt: post.publishedAt,
	deletedAt: post.deletedAt,
	createdAt: post.createdAt,
	updatedAt: post.updatedAt,
};

class PostDao {
	/**
	 * 创建新文章（通常为空草稿，由 service 层填充初始数据）
	 * @param data 文章实体
	 * @returns 插入后的完整记录
	 */
	async create(data: NewPost) {
		const result = await db.insert(post).values(data).returning();
		invalidatePostCaches();
		return result[0];
	}

	// ─── 管理员 · 列表 ──────────────────────────────────────────────────────────

	/**
	 * 【管理员 · 列表】分页查询所有文章
	 * 支持按 status 过滤（草稿/已发布/归档/回收站）和关键词搜索
	 * 不返回 content / contentMarkdown，避免把整篇文章数据传给列表页
	 * @param options 分页、状态过滤、关键词搜索
	 * @returns { list, total }
	 */
	async findAll(options: TPostListQueryDTO = {}) {
		const { page, pageSize, status, search } =
			options as Required<TPostListQueryDTO>;
		const offset = (page - 1) * pageSize;

		const conditions = [];
		if (status) {
			conditions.push(eq(post.status, status));
		} else {
			conditions.push(ne(post.status, "deleted"));
		}
		if (search) {
			conditions.push(
				or(
					like(post.title, `%${search}%`),
					like(post.contentText, `%${search}%`),
				),
			);
		}
		const where = conditions.length > 0 ? and(...conditions) : undefined;

		const [list, totalResult] = await Promise.all([
			db
				.select(listColumns)
				.from(post)
				.where(where)
				.orderBy(desc(post.updatedAt))
				.limit(pageSize)
				.offset(offset),
			db.select({ total: count() }).from(post).where(where),
		]);

		return { list, total: totalResult[0].total };
	}

	// ─── 管理员 · 单条 ──────────────────────────────────────────────────────────

	/**
	 * 【管理员 · 单条】根据 UUID 获取文章，含 content JSON
	 * 后台点击「编辑」时调用，编辑器需要完整的 ProseMirror JSON 才能还原所有排版
	 * @param uuid 文章唯一标识
	 * @returns 完整文章记录或 null
	 */
	async findById(uuid: string) {
		const result = await db
			.select()
			.from(post)
			.where(eq(post.uuid, uuid))
			.limit(1);
		return result[0] || null;
	}

	// ─── 读者 · 单条 ────────────────────────────────────────────────────────────

	/**
	 * 【读者 · 单条】根据 slug 获取单篇已发布文章
	 * 纯读路径，不触发 viewCount 自增。viewCount 累积由 viewCounterService 异步批量 flush
	 * 带 60s TTL 缓存：mutation 时统一清空
	 * @param slug URL 中的文章标识
	 * @returns 文章记录或 null
	 */
	async findPublishedBySlug(slug: string) {
		const cached = slugCache.get(slug);
		if (cached !== undefined) return cached;
		const result = await db
			.select({
				uuid: post.uuid,
				title: post.title,
				contentMarkdown: post.contentMarkdown,
				contentText: post.contentText,
				coverImage: post.coverImage,
				tags: post.tags,
				slug: post.slug,
				excerpt: post.excerpt,
				viewCount: post.viewCount,
				publishedAt: post.publishedAt,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,
			})
			.from(post)
			.where(and(eq(post.slug, slug), eq(post.status, "published")))
			.limit(1);
		const row = (result[0] as PublishedPostRow | undefined) ?? null;
		slugCache.set(slug, row);
		return row;
	}

	/**
	 * 【内部专用】按 slug 批量增加 viewCount
	 * 由 viewCounterService 周期性调用，把内存累积的 delta 落盘
	 * @param slug 文章标识
	 * @param delta 累积的访问次数（>0）
	 */
	async addViewCount(slug: string, delta: number) {
		if (delta <= 0) return;
		await db
			.update(post)
			.set({ viewCount: sql`${post.viewCount} + ${delta}` })
			.where(eq(post.slug, slug));
	}

	/**
	 * 【内部专用】根据 slug 在所有状态中查找文章（不限 published）
	 * 仅用于 slug 唯一性校验，防止草稿/归档文章占用同一个 slug
	 * @param slug 目标 slug
	 * @param excludeUuid 排除的文章 UUID（更新时排除自身）
	 * @returns 文章记录或 null
	 */
	async findBySlugAny(slug: string, excludeUuid?: string) {
		const conditions = [eq(post.slug, slug)];
		if (excludeUuid) conditions.push(ne(post.uuid, excludeUuid));
		const result = await db
			.select({ uuid: post.uuid, slug: post.slug, status: post.status })
			.from(post)
			.where(and(...conditions))
			.limit(1);
		return result[0] || null;
	}

	// ─── 读者 · 列表 ────────────────────────────────────────────────────────────

	/**
	 * 【读者 · 列表】分页查询已发布文章，支持关键词搜索
	 * 读者访问首页 / 归档页 / 搜索页时调用，只暴露 published 状态的文章
	 * 不含 content / contentMarkdown，仅返回卡片展示所需的摘要字段
	 * @param options 分页 + 可选关键词搜索
	 * @returns { list, total }
	 */
	async findPublished(
		options: { page?: number; pageSize?: number; keyword?: string } = {},
	) {
		const { page = 1, pageSize = 20, keyword } = options;
		const offset = (page - 1) * pageSize;

		const conditions = [eq(post.status, "published")];
		if (keyword) {
			conditions.push(
				or(
					like(post.title, `%${keyword}%`),
					like(post.contentText, `%${keyword}%`),
				) as ReturnType<typeof eq>,
			);
		}
		const where = and(...conditions);

		const [list, totalResult] = await Promise.all([
			db
				.select(listColumns)
				.from(post)
				.where(where)
				.orderBy(desc(post.publishedAt))
				.limit(pageSize)
				.offset(offset),
			db.select({ total: count() }).from(post).where(where),
		]);

		return { list, total: totalResult[0].total };
	}

	/**
	 * 【读者 · 归档页】获取所有已发布文章的轻量列表，不分页
	 * 仅返回归档页时间轴所需的最小字段集合：title / slug / publishedAt / tags
	 * 带 60s TTL 缓存：mutation 时统一清空
	 * @returns 按发布时间倒序排列的文章数组
	 */
	async findAllPublishedForArchive() {
		const cached = archiveCache.get(ARCHIVE_KEY);
		if (cached !== undefined) return cached;
		const list = await db
			.select({
				title: post.title,
				slug: post.slug,
				publishedAt: post.publishedAt,
				tags: post.tags,
			})
			.from(post)
			.where(eq(post.status, "published"))
			.orderBy(desc(post.publishedAt));
		archiveCache.set(ARCHIVE_KEY, list);
		return list;
	}

	/**
	 * 一次查询获取各状态的文章数量与总访问量（用于列表页 filter badge / 仪表盘统计）
	 * @returns { all, draft, published, archived, deleted, totalViews }
	 */
	async countByStatus() {
		const result = await db
			.select({
				all: count(sql`CASE WHEN ${post.status} <> 'deleted' THEN 1 END`),
				draft: count(sql`CASE WHEN ${post.status} = 'draft' THEN 1 END`),
				published: count(
					sql`CASE WHEN ${post.status} = 'published' THEN 1 END`,
				),
				archived: count(sql`CASE WHEN ${post.status} = 'archived' THEN 1 END`),
				deleted: count(sql`CASE WHEN ${post.status} = 'deleted' THEN 1 END`),
				totalViews: sum(post.viewCount),
			})
			.from(post);
		return {
			...result[0],
			totalViews: Number(result[0].totalViews ?? 0),
		};
	}

	/**
	 * 更新文章字段，支持部分更新，自动过滤 undefined 值
	 * @param uuid 文章唯一标识
	 * @param data 要更新的字段
	 * @returns 更新后的完整记录，若未找到则返回 null
	 */
	async update(uuid: string, data: PostUpdate) {
		const updateData = Object.fromEntries(
			Object.entries(data).filter(([_, v]) => v !== undefined),
		);

		if (Object.keys(updateData).length === 0) return null;

		const result = await db
			.update(post)
			.set(updateData)
			.where(eq(post.uuid, uuid))
			.returning();
		invalidatePostCaches();
		return result[0] || null;
	}

	/**
	 * 永久删除文章（硬删除）
	 * 调用方（service 层）应在执行前确认 status 为 'deleted'，以防误删
	 * @param uuid 文章唯一标识
	 * @returns 被删除的记录，未找到则返回 null
	 */
	async permanentDelete(uuid: string) {
		const result = await db.delete(post).where(eq(post.uuid, uuid)).returning();
		invalidatePostCaches();
		return result[0] || null;
	}
}

export const postDao = new PostDao();
