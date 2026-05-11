// src/routes/post.route.ts
import { Elysia } from "elysia";
import {
	PostListQueryDTO,
	PublicPostListQueryDTO,
	SavePostDTO,
	UpdatePostStatusDTO,
} from "../dtos/post.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { postService } from "../services/post.service";

export const postRoute = new Elysia({ name: "postRoute" })
	.use(authPlugin)
	// ─── 管理员接口 ──────────────────────────────────────────────────────────────
	.group("/posts", { detail: { tags: ["Posts · 管理员"] } }, (app) =>
		app
			/**
			 * POST /posts
			 * 新建空草稿，返回含 uuid 的记录，后续上传封面图和保存内容均依赖此 uuid
			 */
			.post(
				"/",
				async () => {
					const post = await postService.create();
					return { message: "草稿已创建", post };
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "新建草稿 (POST)" },
				},
			)
			/**
			 * GET /posts
			 * 分页查询所有文章，支持按 status 过滤和关键词搜索
			 */
			.get(
				"/",
				async ({ query }) => {
					const result = await postService.getList(query);
					return { message: "获取成功", ...result };
				},
				{
					beforeHandle: ensureAdminIfExists,
					query: PostListQueryDTO,
					detail: { summary: "文章列表 (GET)" },
				},
			)
			/**
			 * GET /posts/counts
			 * 一次返回各状态文章数量，供列表页 filter badge 使用
			 */
			.get(
				"/counts",
				async () => {
					const counts = await postService.getCounts();
					return { message: "获取成功", counts };
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "各状态文章数量 (GET)" },
				},
			)
			/**
			 * GET /posts/:uuid
			 * 获取单篇文章完整数据（含 content JSON），用于编辑器加载
			 */
			.get(
				"/:uuid",
				async ({ params: { uuid } }) => {
					const post = await postService.getById(uuid);
					return { message: "获取成功", post };
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "获取单篇文章（编辑器用）(GET)" },
				},
			)
			/**
			 * PATCH /posts/:uuid
			 * 保存文章内容（支持自动保存和手动保存，所有字段可选）
			 */
			.patch(
				"/:uuid",
				async ({ params: { uuid }, body }) => {
					const post = await postService.save(uuid, body);
					return { message: "保存成功", post };
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: SavePostDTO,
					detail: { summary: "保存文章内容 (PATCH)" },
				},
			)
			/**
			 * PATCH /posts/:uuid/status
			 * 单独变更文章状态：发布 / 移入回收站 / 恢复草稿 / 归档
			 */
			.patch(
				"/:uuid/status",
				async ({ params: { uuid }, body: { status } }) => {
					const post = await postService.updateStatus(uuid, status);
					return { message: "状态已更新", post };
				},
				{
					beforeHandle: ensureAdminIfExists,
					body: UpdatePostStatusDTO,
					detail: { summary: "变更文章状态 (PATCH)" },
				},
			)
			/**
			 * DELETE /posts/:uuid
			 * 永久删除文章（硬删除），仅允许对回收站中的文章执行
			 */
			.delete(
				"/:uuid",
				async ({ params: { uuid } }) => {
					await postService.permanentDelete(uuid);
					return { message: "文章已永久删除" };
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: {
						summary: "永久删除文章 (DELETE)",
						description:
							"只允许删除已在回收站（status=deleted）的文章，需先调用状态接口移入回收站",
					},
				},
			),
	)
	// ─── 前台接口（无需登录） ────────────────────────────────────────────────────
	.group("/public/posts", { detail: { tags: ["Posts · 前台"] } }, (app) =>
		app
			/**
			 * GET /public/posts
			 * 获取已发布文章列表，支持分页和关键词搜索（header 搜索栏使用）
			 */
			.get(
				"/",
				async ({ query }) => {
					const result = await postService.getPublishedList(query);
					return { message: "获取成功", ...result };
				},
				{
					query: PublicPostListQueryDTO,
					detail: {
						summary: "已发布文章列表（前台）(GET)",
						description:
							"无需登录，仅返回 published 状态的文章，支持关键词搜索",
					},
				},
			)
			/**
			 * GET /public/posts/:slug
			 * 按 slug 获取单篇已发布文章（含 contentMarkdown，供前台渲染）
			 */
			.get(
				"/:slug",
				async ({ params: { slug } }) => {
					const post = await postService.getBySlug(slug);
					return { message: "获取成功", post };
				},
				{
					detail: {
						summary: "获取单篇文章（前台）(GET)",
						description: "无需登录，未发布的文章返回 404",
					},
				},
			),
	);
