// src/services/sitemap.service.ts
import { desc, eq } from "drizzle-orm";
import { db } from "../../db/connection";
import { post } from "../../db/schema";
import { SITEMAP_STATIC_PATHS } from "../constants";

class SitemapService {
	/**
	 * 生成 Sitemap XML
	 * @param siteUrl 站点完整 URL（如 https://yourdomain.com）
	 */
	async generateSitemap(siteUrl: string): Promise<string> {
		// 查询所有已发布文章的 slug 和 updatedAt
		const posts = await db
			.select({
				slug: post.slug,
				updatedAt: post.updatedAt,
			})
			.from(post)
			.where(eq(post.status, "published"))
			.orderBy(desc(post.publishedAt));

		let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
		xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

		// 固定页面
		for (const path of SITEMAP_STATIC_PATHS) {
			xml += `<url>\n  <loc>${siteUrl}${path === "/" ? "" : path}</loc>\n</url>\n`;
		}

		// 动态文章页面
		for (const item of posts) {
			if (!item.slug) continue;
			const lastmod = item.updatedAt.toISOString();
			xml += `<url>\n  <loc>${siteUrl}/posts/${item.slug}</loc>\n  <lastmod>${lastmod}</lastmod>\n</url>\n`;
		}

		xml += `</urlset>`;
		return xml;
	}
}

export const sitemapService = new SitemapService();
