// src/services/upload.service.ts
import { join } from "node:path";
import { createId } from "@paralleldrive/cuid2";
import { POST_UPLOADS_DIR, SOCIAL_UPLOADS_DIR, SYSTEM_UPLOADS_DIR } from "../constants";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import { ImageService } from "./image.service";

class UploadService {
	private logger = logger.withTag("UploadService");

	/**
	 * 上传并处理网站图标 (Favicon)
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadFavicon(file: File) {
		return this.uploadAsset(
			file,
			SYSTEM_UPLOADS_DIR,
			"/api/uploads/system",
			"favicon.png",
			"网站图标",
			true,
		);
	}

	/**
	 * 上传并处理首页 Hero 横幅
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadHero(file: File) {
		return this.uploadAsset(
			file,
			SYSTEM_UPLOADS_DIR,
			"/api/uploads/system",
			"hero.webp",
			"首页横幅",
			false,
		);
	}

	/**
	 * 上传并处理管理员头像
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadAvatar(file: File) {
		return this.uploadAsset(
			file,
			SYSTEM_UPLOADS_DIR,
			"/api/uploads/system",
			"avatar.webp",
			"管理员头像",
			false,
		);
	}

	/**
	 * 上传并处理社交媒体链接图标
	 * @param file 原始图片文件
	 * @param key 社交平台的标识符
	 * @param mode 图标模式 (light | dark)
	 * @returns 处理后的访问路径
	 */
	async uploadSocialIcon(file: File, key: string, mode: "light" | "dark") {
		const filename = `${key}-${mode}.png`;
		return this.uploadAsset(
			file,
			SOCIAL_UPLOADS_DIR,
			"/api/uploads/social",
			filename,
			"社交图标",
			true,
		);
	}

	/**
	 * 上传文章封面图
	 * 存储为 posts/{postUuid}/cover.webp，替换时直接覆盖同名文件
	 * @param file 原始图片文件
	 * @param postUuid 文章 UUID（用于确定存储子目录）
	 * @returns 封面图的 Web 访问路径
	 */
	async uploadPostCover(file: File, postUuid: string) {
		const dir = join(POST_UPLOADS_DIR, postUuid);
		const webPrefix = `/api/uploads/posts/${postUuid}`;
		return this.uploadAsset(file, dir, webPrefix, "cover.webp", "文章封面图", false);
	}

	/**
	 * 上传文章行内图（编辑器粘贴/插入时调用）
	 * 存储为 posts/{postUuid}/{cuid}.webp，每张图片独立命名不覆盖
	 * @param file 原始图片文件
	 * @param postUuid 文章 UUID（用于确定存储子目录）
	 * @returns 行内图的 Web 访问路径
	 */
	async uploadPostImage(file: File, postUuid: string) {
		const filename = `${createId()}.webp`;
		const dir = join(POST_UPLOADS_DIR, postUuid);
		const webPrefix = `/api/uploads/posts/${postUuid}`;
		return this.uploadAsset(file, dir, webPrefix, filename, "文章行内图", false);
	}

	/**
	 * 统一处理静态资源上传
	 * @param file 文件对象
	 * @param baseDir 物理存储基础目录
	 * @param webPrefix Web 访问前缀
	 * @param filename 存储文件名
	 * @param displayName 日志显示的名称
	 * @param isIcon 是否进行图标特殊处理 (128x128 PNG)
	 */
	private async uploadAsset(
		file: File,
		baseDir: string,
		webPrefix: string,
		filename: string,
		displayName: string,
		isIcon: boolean,
	) {
		try {
			const physicalPath = join(baseDir, filename);
			const webPath = `${webPrefix}/${filename}`;

			await ImageService.optimizeAndSave(file, physicalPath, isIcon);

			this.logger.info({ webPath }, `${displayName}已成功上传`);

			return {
				url: webPath,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error({ error: errorMessage }, `${displayName}上传失败`);

			throw new BusinessError(`${displayName}处理失败，请重试`, {
				status: 500,
			});
		}
	}
}

export const uploadService = new UploadService();
