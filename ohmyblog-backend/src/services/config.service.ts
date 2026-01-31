// src/services/config.service.ts
import { join } from "node:path";
import { SYSTEM_UPLOADS_DIR } from "../constants";
import { configDao, type NewConfig } from "../dao/config.dao";
import type { TConfigUpsertDTO } from "../dtos/config.dto";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger.plugin";
import { ImageService } from "./image.service";

class ConfigService {
	private logger = systemLogger.child({ module: "ConfigService" });

	/**
	 * 保存或更新配置, 存在则更新, 不存在则创建
	 * @param data 配置载荷，包含 configKey 以及要更新的字段
	 * @returns 新增或更新后的配置记录
	 */
	async upsert(data: TConfigUpsertDTO) {
		const { configKey, ...updateFields } = data;

		// 查找是否存在
		const existing = await configDao.findByKey(configKey);

		if (existing) {
			// 存在则更新
			const updated = await configDao.updateByKey(configKey, updateFields);
			this.logger.info({ configKey }, "配置已更新");
			return updated;
		} else {
			if (data.configValue === undefined) {
				throw new BusinessError(
					`创建新配置 [${configKey}] 时，configValue 不能为空`,
					{
						status: 400,
					},
				);
			}
			// 不存在则创建
			const created = await configDao.createConfig(data as NewConfig);
			this.logger.info({ configKey }, "配置已创建");
			return created;
		}
	}

	/**
	 * 删除配置，不存在则 404
	 * @param configKey 要删除的配置键名
	 * @returns 被删除的配置记录
	 */
	async delete(configKey: string) {
		const removed = await configDao.deleteByKey(configKey);
		if (!removed) {
			throw new BusinessError("配置不存在", { status: 404 });
		}
		this.logger.info({ configKey }, "配置已删除");
		return removed;
	}

	/**
	 * 获取单个配置
	 * @param configKey 键名
	 * @param isAdmin 是否以管理员身份访问 (如果是，则绕过 isPublic 限制)
	 * @returns 配置记录，若不存在或无权限则抛出 404
	 */
	async getByKey(configKey: string, isAdmin: boolean = false) {
		const item = await configDao.findByKey(configKey);
		if (!item || (!isAdmin && !item.isPublic)) {
			throw new BusinessError("配置不存在", { status: 404 });
		}
		return item;
	}

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
		return this.uploadSystemAsset(file, "hero-banner.webp", "首页横幅", false);
	}

	/**
	 * 上传并处理管理员头像
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadAvatar(file: File) {
		return this.uploadSystemAsset(
			file,
			"admin-avatar.webp",
			"管理员头像",
			false,
		);
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

export const configService = new ConfigService();
