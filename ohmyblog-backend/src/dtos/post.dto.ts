// src/dtos/post.dto.ts
import { type Static, t } from "elysia";
import { postStatuses } from "../../db/constants/post.constants";
import { tStringEnum } from "../utils/typebox";

// 1. 保存文章内容 DTO（编辑器自动保存 / 手动保存时调用）
export const SavePostDTO = t.Object({
	title: t.Optional(
		t.String({
			maxLength: 255,
			description: "文章标题",
			error: "post.title_range",
		}),
	),
	// 编辑器输出的 ProseMirror JSON，原样传入，后端直接存储
	content: t.Optional(
		t.Any({
			description: "ProseMirror JSON，编辑器源数据",
		}),
	),
	// 由前端 Tiptap 导出的纯 Markdown，随 content 一并传入
	contentMarkdown: t.Optional(
		t.String({
			description: "纯 Markdown 文本，由前端从编辑器导出",
		}),
	),
	// 由前端 editor.getText() 导出的纯文本，用于搜索和列表预览
	contentText: t.Optional(
		t.String({
			description: "纯文本，由前端从编辑器提取，用于搜索和列表预览",
		}),
	),
	coverImage: t.Optional(
		t.String({
			description: "封面图 URL",
			error: "post.cover_image_invalid",
		}),
	),
	tags: t.Optional(
		t.Array(
			t.String({
				description: "标签名",
				error: "post.tag_invalid",
			}),
			{
				description: "标签列表",
				error: "post.tags_invalid",
			},
		),
	),
	slug: t.Optional(
		t.String({
			minLength: 1,
			pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
			description: "URL slug，只允许小写字母、数字和连字符，如 my-first-post",
			error: "post.slug_invalid",
		}),
	),
	excerpt: t.Optional(
		t.String({
			maxLength: 500,
			description: "手动摘要，未填则由前台取 contentText 前 N 字",
			error: "post.excerpt_range",
		}),
	),
});

// 2. 更改文章状态 DTO
export const UpdatePostStatusDTO = t.Object({
	status: tStringEnum(postStatuses, {
		description: "目标状态：draft / published / archived / deleted",
		error: "post.status_invalid",
	}),
});

// 3. 管理端文章列表查询参数 DTO（Query String）
export const PostListQueryDTO = t.Object({
	page: t.Optional(
		t.Numeric({
			minimum: 1,
			default: 1,
			description: "页码，从 1 开始",
			error: "post.page_invalid",
		}),
	),
	pageSize: t.Optional(
		t.Numeric({
			minimum: 1,
			maximum: 100,
			default: 10,
			description: "每页条数，最大 100",
			error: "post.page_size_invalid",
		}),
	),
	status: t.Optional(
		tStringEnum(postStatuses, {
			description: "按状态过滤",
			error: "post.status_invalid",
		}),
	),
	search: t.Optional(
		t.String({
			maxLength: 500,
			description: "关键词，匹配标题或正文纯文本",
			error: "post.search_range",
		}),
	),
});

// 4. 前台文章列表查询参数 DTO（Query String，分页 + 关键词搜索）
export const PublicPostListQueryDTO = t.Object({
	page: t.Optional(
		t.Numeric({
			minimum: 1,
			default: 1,
			description: "页码，从 1 开始",
			error: "post.page_invalid",
		}),
	),
	pageSize: t.Optional(
		t.Numeric({
			minimum: 1,
			maximum: 50,
			default: 20,
			description: "每页条数，最大 50",
			error: "post.page_size_invalid",
		}),
	),
	keyword: t.Optional(
		t.String({
			description: "关键词，模糊匹配标题和正文",
		}),
	),
});

export type TSavePostDTO = Static<typeof SavePostDTO>;
export type TUpdatePostStatusDTO = Static<typeof UpdatePostStatusDTO>;
export type TPostListQueryDTO = Static<typeof PostListQueryDTO>;
export type TPublicPostListQueryDTO = Static<typeof PublicPostListQueryDTO>;
