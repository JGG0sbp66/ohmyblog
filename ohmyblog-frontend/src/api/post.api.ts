// src/api/post.api.ts
import { api, unwrap } from "./client";
import type { TPostStatus } from "@server/db/constants/post.constants";
import type { TPost } from "@server/db/table/post";
import type {
  TSavePostDTO,
  TPostListQueryDTO,
  TPublicPostListQueryDTO,
} from "@server/dtos/post.dto";

/** 文章列表项（用于管理端列表展示） */
export type PostListItem = Omit<TPost, "content" | "contentMarkdown">;

/** 文章详情（用于编辑器加载） */
export type PostDetail = TPost;

/**
 * POST /api/posts
 * 创建空草稿
 */
export const createPost = () => {
  return unwrap(api.api.posts.post());
};

/**
 * GET /api/posts
 * 分页获取文章列表
 */
export const getPostList = (query: TPostListQueryDTO) => {
  return unwrap(api.api.posts.get({ query }));
};

/**
 * GET /api/posts/counts
 * 获取各状态文章数量（filter badge 用）
 */
export const getPostCounts = () => {
  return unwrap(api.api.posts.counts.get());
};

/**
 * GET /api/posts/:uuid
 * 获取文章详情
 */
export const getPostById = (uuid: string) => {
  return unwrap(api.api.posts({ uuid }).get());
};

/**
 * PATCH /api/posts/:uuid
 * 保存文章内容
 */
export const savePost = (uuid: string, body: TSavePostDTO) => {
  return unwrap(api.api.posts({ uuid }).patch(body));
};

/**
 * PATCH /api/posts/:uuid/status
 * 变更文章状态
 */
export const updatePostStatus = (uuid: string, status: TPostStatus) => {
  return unwrap(api.api.posts({ uuid }).status.patch({ status }));
};

/**
 * DELETE /api/posts/:uuid
 * 永久删除文章
 */
export const permanentDeletePost = (uuid: string) => {
  return unwrap(api.api.posts({ uuid }).delete());
};

// ─── 前台公开接口（无需登录） ────────────────────────────────────────────────

/**
 * GET /api/public/posts
 * 获取已发布文章列表（前台首页 / 归档页使用）
 */
export const getPublicPostList = (query?: TPublicPostListQueryDTO) => {
  return unwrap(api.api.public.posts.get({ query }));
};

/**
 * GET /api/public/posts/:slug
 * 根据 slug 获取单篇已发布文章（含 contentMarkdown）
 */
export const getPublicPostBySlug = (slug: string) => {
  return unwrap(api.api.public.posts({ slug }).get());
};
