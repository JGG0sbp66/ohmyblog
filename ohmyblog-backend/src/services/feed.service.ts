// src/services/feed.service.ts
import { Feed } from "feed";
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { post } from "../../db/schema";
import { configDao } from "../daos/config.dao";
import type { TSiteInfoConfigUpsertDTO } from "../dtos/config.dto";

/** Feed 输出的文章数量上限 */
const FEED_LIMIT = 20;

class FeedService {
	/**
	 * 生成 RSS 2.0 Feed XML
	 * @param siteUrl 站点完整 URL（如 https://yourdomain.com），从请求头推导
	 */
	async generateRss(siteUrl: string): Promise<string> {
		// 1. 获取站点信息
		const siteRecord = await configDao.findByKey("site_info");
		const siteInfo = siteRecord?.configValue as
			| TSiteInfoConfigUpsertDTO["configValue"]
			| null;

		// 获取作者名
		const personalRecord = await configDao.findByKey("personal_info");
		const authorName = (
			personalRecord?.configValue as { username?: string } | null
		)?.username;

		// 2. 查询最近 N 篇已发布文章
		const posts = await db
			.select({
				uuid: post.uuid,
				title: post.title,
				slug: post.slug,
				contentHtml: post.contentHtml,
				excerpt: post.excerpt,
				coverImage: post.coverImage,
				publishedAt: post.publishedAt,
				updatedAt: post.updatedAt,
			})
			.from(post)
			.where(eq(post.status, "published"))
			.orderBy(desc(post.publishedAt))
			.limit(FEED_LIMIT);

		// 3. 构建 Feed
		const latestPost = posts[0];
		const faviconUrl = siteInfo?.favicon
			? `${siteUrl}${siteInfo.favicon}`
			: undefined;

		const feed = new Feed({
			title: siteInfo?.title ?? "",
			description: siteInfo?.footerSlogan ?? "",
			id: siteUrl,
			link: siteUrl,
			language: "zh-CN",
			favicon: faviconUrl,
			image: faviconUrl,
			updated: latestPost?.publishedAt ?? new Date(),
			feedLinks: {
				rss2: `${siteUrl}/feed`,
			},
			author: authorName ? { name: authorName } : undefined,
		});

		// 4. 添加文章条目
		for (const item of posts) {
			if (!item.slug) continue;

			const postUrl = `${siteUrl}/posts/${item.slug}`;
			// 将 HTML 中的相对路径图片转为绝对 URL
			const content = item.contentHtml
				? this.resolveRelativeUrls(item.contentHtml, siteUrl)
				: undefined;

			feed.addItem({
				title: item.title,
				id: postUrl,
				link: postUrl,
				description: item.excerpt ?? undefined,
				content,
				date: item.publishedAt ?? item.updatedAt,
				image: item.coverImage
					? this.resolveUrl(item.coverImage, siteUrl)
					: undefined,
				author: authorName ? [{ name: authorName }] : undefined,
			});
		}

		return feed.rss2();
	}

	/**
	 * 将 HTML 中 src/href 的相对路径转为绝对 URL
	 * 匹配 src="/..." 和 href="/..." 格式
	 */
	private resolveRelativeUrls(html: string, siteUrl: string): string {
		return html.replace(
			/(src|href)="(\/[^"]*?)"/g,
			(_, attr, path) => `${attr}="${siteUrl}${path}"`,
		);
	}

	/** 单个 URL：相对路径加上 siteUrl 前缀 */
	private resolveUrl(url: string, siteUrl: string): string {
		if (url.startsWith("/")) return `${siteUrl}${url}`;
		return url;
	}
}

export const feedService = new FeedService();
