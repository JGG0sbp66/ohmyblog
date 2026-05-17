// src/daos/caches/post.cache.ts
//
// 文章相关的进程内缓存。集中存放配置/类型/失效器，
// post.dao.ts 只关心 SQL，不再被缓存样板代码淹没。
//
// 失效模型：所有 mutation（create / update / permanentDelete）
// 都通过 invalidatePostCaches 一次性清空全部三个 cache，
// 因为列表/归档与单文档之间存在强依赖（一篇文章发布会影响 archive 和 publishedList）。
//
// 注意：addViewCount 故意不触发失效——viewCount 在缓存里反正不准（异步累加），
// 等 TTL 过期或下一次 mutation 顺带刷新即可，避免高频访问让缓存命中率归零。

import { TTLCache } from "../../utils/cache";

// 单文档：findPublishedBySlug 的返回结构
export type PublishedPostRow = {
	uuid: string;
	title: string;
	contentMarkdown: string | null;
	wordCount: number;
	coverImage: string | null;
	tags: unknown;
	slug: string | null;
	excerpt: string | null;
	viewCount: number;
	publishedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

// 归档页轻量结构
export type ArchiveRow = {
	title: string;
	slug: string | null;
	publishedAt: Date | null;
	tags: unknown;
};

// 公开列表的卡片结构（与 listColumns 对齐）
export type PublishedListRow = {
	uuid: string;
	title: string;
	contentText: string | null;
	coverImage: string | null;
	status: string;
	tags: unknown;
	slug: string | null;
	excerpt: string | null;
	viewCount: number;
	publishedAt: Date | null;
	deletedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type PublishedListResult = { list: PublishedListRow[]; total: number };

/** 归档缓存只有一个 key，对应"所有 published 文章" */
export const ARCHIVE_KEY = "all";

/**
 * 三块 cache 集中声明：方便一眼看清 TTL / 容量配置
 */
export const postCaches = {
	/** 单文档按 slug 缓存。null 也会被缓存以防穿透 */
	slug: new TTLCache<string, PublishedPostRow | null>({
		ttlMs: 60_000,
		maxSize: 512,
	}),
	/** 归档页全表轻量列表，单 key */
	archive: new TTLCache<string, ArchiveRow[]>({
		ttlMs: 60_000,
		maxSize: 4,
	}),
	/** 公开分页列表（仅缓存无关键词的固定 page+pageSize 组合） */
	publishedList: new TTLCache<string, PublishedListResult>({
		ttlMs: 60_000,
		maxSize: 32,
	}),
};

/** 任意 mutation 后调用，一次性清空所有相关 cache */
export function invalidatePostCaches() {
	postCaches.slug.clear();
	postCaches.archive.clear();
	postCaches.publishedList.clear();
}
