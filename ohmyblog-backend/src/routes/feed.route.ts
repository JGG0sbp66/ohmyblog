// src/routes/feed.route.ts
import { Elysia } from "elysia";
import { feedService } from "../services/feed.service";

export const feedRoute = new Elysia({ name: "feedRoute" }).get(
	"/feed",
	async ({ request }) => {
		// 从请求头推导站点完整 URL
		const url = new URL(request.url);
		const siteUrl = `${url.protocol}//${url.host}`;

		const xml = await feedService.generateRss(siteUrl);

		return new Response(xml, {
			headers: {
				"Content-Type": "application/xml; charset=utf-8",
			},
		});
	},
	{
		detail: {
			tags: ["Feed"],
			summary: "RSS Feed（RSS 订阅）",
			description: "返回最近发布的文章 RSS 2.0 Feed",
		},
	},
);
