// src/services/post.service.ts
import type { TPostStatus } from "../../db/constants/post.constants";
import type { TPostListQueryDTO, TSavePostDTO } from "../dtos/post.dto";
import { postDao } from "../daos/post.dao";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";

class PostService {
	private logger = logger.withTag("PostService");

	/**
	 * 创建空草稿
	 * 前端点击「新建文章」时调用，立即落库并返回 uuid
	 * 后续上传封面图、保存内容都依赖这个 uuid
	 * @returns 新建的草稿记录（含 uuid）
	 */
	async create() {
		const post = await postDao.create({});
		this.logger.info({ postId: post.uuid }, "新建草稿");
		return post;
	}

	// ─── 管理员 · 列表 ──────────────────────────────────────────────────────────

	/**
	 * 获取文章列表（管理端）
	 * @param options 分页、状态过滤、关键词搜索
	 * @returns { list, total }
	 */
	async getList(options: TPostListQueryDTO = {}) {
		return postDao.findAll(options);
	}

	// ─── 管理员 · 单条 ──────────────────────────────────────────────────────────

	/**
	 * 根据 UUID 获取文章完整数据（含 content JSON，供编辑器加载）
	 * @param uuid 文章唯一标识
	 * @returns 文章记录
	 */
	async getById(uuid: string) {
		const post = await postDao.findById(uuid);
		if (!post) {
			throw new BusinessError("文章不存在", { status: 404 });
		}
		return post;
	}

	// ─── 读者 · 列表 ────────────────────────────────────────────────────────────

	/**
	 * 获取已发布文章列表（前台首页 / 归档页）
	 * @param options 分页参数
	 * @returns { list, total }
	 */
	async getPublishedList(options: TPostListQueryDTO = {}) {
		return postDao.findPublished(options);
	}

	// ─── 读者 · 单条 ────────────────────────────────────────────────────────────

	/**
	 * 根据 slug 获取已发布文章（前台文章详情页）
	 * @param slug URL 中的文章标识
	 * @returns 文章记录（含 contentMarkdown）
	 */
	async getBySlug(slug: string) {
		const post = await postDao.findBySlug(slug);
		if (!post) {
			throw new BusinessError("文章不存在", { status: 404 });
		}
		return post;
	}

	// ─── 编辑保存 ────────────────────────────────────────────────────────────────

	/**
	 * 保存文章内容（自动保存 / 手动保存）
	 * content / contentMarkdown / contentText 由前端 Tiptap 导出后随请求传入
	 * @param uuid 文章唯一标识
	 * @param data 待保存的字段（全部可选，支持增量更新）
	 * @returns 更新后的文章记录
	 */
	async save(uuid: string, data: TSavePostDTO) {
		const post = await postDao.findById(uuid);
		if (!post) {
			throw new BusinessError("文章不存在", { status: 404 });
		}

		// slug 唯一性校验：跨所有状态检查，防止草稿/归档文章占用同一 slug
		// 使用 excludeUuid 排除自身，确保同一篇文章多次保存不会误报冲突
		if (data.slug && data.slug !== post.slug) {
			const existing = await postDao.findBySlugAny(data.slug, uuid);
			if (existing) {
				throw new BusinessError("该 slug 已被其他文章使用", { status: 409 });
			}
		}

		const updated = await postDao.update(uuid, data);
		this.logger.info({ postId: uuid }, "文章已保存");
		return updated;
	}

	// ─── 状态变更 ────────────────────────────────────────────────────────────────

	/**
	 * 更改文章状态，并自动维护相关时间戳
	 *
	 * 状态流转规则：
	 *   → published : 设置 publishedAt（若尚未发布过则记录首次发布时间）
	 *   → deleted   : 设置 deletedAt = now()，表示移入回收站
	 *   → draft / archived : 清除 deletedAt（从回收站恢复时使用）
	 *
	 * @param uuid 文章唯一标识
	 * @param targetStatus 目标状态
	 * @returns 更新后的文章记录
	 */
	async updateStatus(uuid: string, targetStatus: TPostStatus) {
		const post = await postDao.findById(uuid);
		if (!post) {
			throw new BusinessError("文章不存在", { status: 404 });
		}

		if (post.status === targetStatus) {
			return post;
		}

		const now = new Date();
		const patch: Record<string, unknown> = { status: targetStatus };

		if (targetStatus === "published") {
			// 首次发布才记录 publishedAt，重新发布不覆盖原发布时间
			if (!post.publishedAt) {
				patch.publishedAt = now;
			}
		} else if (targetStatus === "deleted") {
			patch.deletedAt = now;
		} else {
			// draft / archived：从回收站恢复，清除 deletedAt
			patch.deletedAt = null;
		}

		const updated = await postDao.update(uuid, patch);
		this.logger.info({ postId: uuid, from: post.status, to: targetStatus }, "文章状态已变更");
		return updated;
	}

	// ─── 永久删除 ────────────────────────────────────────────────────────────────

	/**
	 * 永久删除文章（硬删除）
	 * 只允许对 status 为 'deleted'（已在回收站）的文章执行，避免误删
	 * @param uuid 文章唯一标识
	 */
	async permanentDelete(uuid: string) {
		const post = await postDao.findById(uuid);
		if (!post) {
			throw new BusinessError("文章不存在", { status: 404 });
		}

		if (post.status !== "deleted") {
			throw new BusinessError("只能永久删除回收站中的文章，请先将文章移入回收站", {
				status: 400,
			});
		}

		await postDao.permanentDelete(uuid);
		this.logger.info({ postId: uuid }, "文章已永久删除");
	}
}

export const postService = new PostService();
