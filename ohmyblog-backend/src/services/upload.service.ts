// src/services/upload.service.ts
import { join } from "node:path";
import { SOCIAL_UPLOADS_DIR, SYSTEM_UPLOADS_DIR } from "../constants";
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
	 * @returns 处理后的访问路径
	 */
	async uploadSocialIcon(file: File, key: string) {
		const filename = `${key}.png`;
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
