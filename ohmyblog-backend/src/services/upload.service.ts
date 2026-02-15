// src/services/upload.service.ts
import { join } from "node:path";
import { SYSTEM_UPLOADS_DIR } from "../constants";
import { userDao } from "../daos/user.dao";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger.plugin";
import { ImageService } from "./image.service";

class UploadService {
	private logger = systemLogger.child({ module: "UploadService" });

	/**
	 * 上传并处理网站图标 (Favicon)
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadFavicon(file: File) {
		return this.uploadSystemAsset(file, "favicon.png", "网站图标", true);
	}

	/**
	 * 上传并处理首页 Hero 横幅
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadHero(file: File) {
		return this.uploadSystemAsset(file, "hero.webp", "首页横幅", false);
	}

	/**
	 * 上传并处理管理员头像，并同步更新 users 表中的 avatar_url
	 * @param file 原始图片文件
	 * @param userUuid 用户 UUID
	 * @returns 处理后的访问路径
	 */
	async uploadAvatar(file: File, userUuid: string) {
		const result = await this.uploadSystemAsset(
			file,
			"avatar.webp",
			"管理员头像",
			false,
		);

		try {
			await userDao.updateAvatarUrl(userUuid, result.url);
			this.logger.info({ userUuid, url: result.url }, "已同步更新用户头像字段");
		} catch (error) {
			// 数据库更新失败仅记录日志，不阻断主流程
			this.logger.error({ userUuid, error }, "同步更新用户头像字段失败");
		}

		return result;
	}

	/**
	 * 统一处理系统级静态资源上传
	 * @param file 文件对象
	 * @param filename 存储文件名
	 * @param displayName 日志显示的名称
	 * @param isIcon 是否进行图标特殊处理 (128x128 PNG)
	 */
	private async uploadSystemAsset(
		file: File,
		filename: string,
		displayName: string,
		isIcon: boolean,
	) {
		try {
			const physicalPath = join(SYSTEM_UPLOADS_DIR, filename);
			const webPath = `/api/uploads/system/${filename}`;

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
