// src/routes/sitemap.route.ts
import { Elysia } from "elysia";
import { sitemapService } from "../services/sitemap.service";

export const sitemapRoute = new Elysia({ name: "sitemapRoute" })
	.get(
		"/sitemap.xml",
		async ({ request }) => {
			const url = new URL(request.url);
			const siteUrl = `${url.protocol}//${url.host}`;

			const xml = await sitemapService.generateSitemap(siteUrl);

			return new Response(xml, {
				headers: {
					"Content-Type": "application/xml; charset=utf-8",
				},
			});
		},
		{
			detail: {
				tags: ["SEO"],
				summary: "Sitemap（站点地图）",
				description: "返回站点地图 XML，供搜索引擎爬取",
			},
		},
	)
	.get(
		"/robots.txt",
		({ request }) => {
			const url = new URL(request.url);
			const siteUrl = `${url.protocol}//${url.host}`;

			const content = [
				"User-agent: *",
				"Allow: /",
				"",
				`Sitemap: ${siteUrl}/sitemap.xml`,
			].join("\n");

			return new Response(content, {
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		},
		{
			detail: {
				tags: ["SEO"],
				summary: "robots.txt",
				description: "搜索引擎爬虫指令文件",
			},
		},
	);
