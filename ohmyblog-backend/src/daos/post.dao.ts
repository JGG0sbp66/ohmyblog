// src/daos/post.dao.ts
import { and, count, desc, eq, like, ne, or, sql, sum } from "drizzle-orm";
import { db } from "../../db/connection";
import { post } from "../../db/schema";
import type { TPostListQueryDTO } from "../dtos/post.dto";
import {
	ARCHIVE_KEY,
	invalidatePostCaches,
	type PublishedListResult,
	type PublishedListRow,
	type PublishedPostRow,
	postCaches,
} from "./caches/post.cache";

export type NewPost = typeof post.$inferInsert;
export type PostUpdate = Partial<
	Omit<NewPost, "uuid" | "createdAt" | "updatedAt">
>;

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
	 * 后台编辑器加载用，需要完整 ProseMirror JSON 还原排版
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
	 * 【读者 · 单条】根据 slug 获取已发布文章。带 60s TTL 缓存
	 * 纯读路径；viewCount 累积由 viewCounterService 异步批量 flush
	 */
	async findPublishedBySlug(slug: string) {
		return postCaches.slug.fetch(slug, async () => {
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
			return (result[0] as PublishedPostRow | undefined) ?? null;
		});
	}

	/**
	 * 【内部专用】按 slug 批量增加 viewCount
	 * 由 viewCounterService 周期性调用，把内存累积的 delta 落盘
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
	 * 用于 slug 唯一性校验
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
	 * 【读者 · 列表】分页查询已发布文章
	 * 缓存策略：仅对"无关键词"分页缓存（首页/归档页是固定 page+pageSize 组合）；
	 * 搜索请求绕过缓存，避免 keyword 组合爆炸
	 */
	async findPublished(
		options: { page?: number; pageSize?: number; keyword?: string } = {},
	) {
		const { page = 1, pageSize = 20, keyword } = options;

		const loader = async (): Promise<PublishedListResult> => {
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

			return {
				list: list as PublishedListRow[],
				total: totalResult[0].total,
			};
		};

		// 有 keyword 的搜索请求绕过缓存
		if (keyword) return loader();
		return postCaches.publishedList.fetch(`${page}:${pageSize}`, loader);
	}

	/**
	 * 【读者 · 归档页】所有已发布文章的轻量列表，不分页。带 60s TTL 缓存
	 */
	async findAllPublishedForArchive() {
		return postCaches.archive.fetch(ARCHIVE_KEY, () =>
			db
				.select({
					title: post.title,
					slug: post.slug,
					publishedAt: post.publishedAt,
					tags: post.tags,
				})
				.from(post)
				.where(eq(post.status, "published"))
				.orderBy(desc(post.publishedAt)),
		);
	}

	/**
	 * 一次查询获取各状态的文章数量与总访问量
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
	 * 更新文章字段，自动过滤 undefined
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
	 * 调用方应在执行前确认 status === 'deleted'
	 */
	async permanentDelete(uuid: string) {
		const result = await db.delete(post).where(eq(post.uuid, uuid)).returning();
		invalidatePostCaches();
		return result[0] || null;
	}
}

export const postDao = new PostDao();
