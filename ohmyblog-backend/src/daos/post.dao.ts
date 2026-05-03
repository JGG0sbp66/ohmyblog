// src/daos/post.dao.ts
import { and, count, desc, eq, like, ne, or, sql } from "drizzle-orm";
import { db } from "../../db/connection";
import { post } from "../../db/schema";
import type { TPostListQueryDTO } from "../dtos/post.dto";

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
	 * @param data 文章实体
	 * @returns 插入后的完整记录
	 */
	async create(data: NewPost) {
		const result = await db.insert(post).values(data).returning();
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
	 * 【读者 · 单条】根据 slug 获取单篇文章，含 contentMarkdown
	 * 读者打开 /posts/my-slug 时调用，只返回已发布的文章，未发布则视为不存在
	 * 返回 contentMarkdown 而非 JSON，由前端用 markdown-it 等库渲染
	 * @param slug URL 中的文章标识
	 * @returns 文章记录或 null
	 */
	async findBySlug(slug: string) {
		const result = await db
			.select({
				uuid: post.uuid,
				title: post.title,
				contentMarkdown: post.contentMarkdown,
				coverImage: post.coverImage,
				tags: post.tags,
				slug: post.slug,
				excerpt: post.excerpt,
				publishedAt: post.publishedAt,
				createdAt: post.createdAt,
				updatedAt: post.updatedAt,
			})
			.from(post)
			.where(and(eq(post.slug, slug), eq(post.status, "published")))
			.limit(1);
		return result[0] || null;
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
		options: Pick<TPostListQueryDTO, "page" | "pageSize" | "search"> = {},
	) {
		const { page, pageSize, search } = options as Required<TPostListQueryDTO>;
		const offset = (page - 1) * pageSize;

		const conditions = [eq(post.status, "published")];
		if (search) {
			conditions.push(
				or(
					like(post.title, `%${search}%`),
					like(post.contentText, `%${search}%`),
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
	 * 一次查询获取各状态的文章数量（用于列表页 filter badge）
	 * @returns { all, draft, published, archived, deleted }
	 */
	async countByStatus() {
		const result = await db
			.select({
				all: count(),
				draft: count(sql`CASE WHEN ${post.status} = 'draft' THEN 1 END`),
				published: count(
					sql`CASE WHEN ${post.status} = 'published' THEN 1 END`,
				),
				archived: count(sql`CASE WHEN ${post.status} = 'archived' THEN 1 END`),
				deleted: count(sql`CASE WHEN ${post.status} = 'deleted' THEN 1 END`),
			})
			.from(post);
		return result[0];
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
		return result[0] || null;
	}
}

export const postDao = new PostDao();
