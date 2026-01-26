// src/services/config.service.ts
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
	 * 仅处理文件并返回路径
	 * @param file 原始图片文件
	 * @returns 处理后的访问路径
	 */
	async uploadFavicon(file: File) {
		try {
			// 定义存储路径
			// 物理路径用于 Sharp 写入，访问路径用于返回给前端
			const filename = "favicon.png";
			const webPath = `/uploads/system/${filename}`;
			const physicalPath = `data${webPath}`; // 结果如: data/uploads/system/favicon.png

			// 调用工具类进行处理
			await ImageService.optimizeAndSave(file, physicalPath, true);

			this.logger.info({ webPath }, "网站图标已成功上传");

			return {
				url: webPath,
			};
		} catch (error: unknown) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			this.logger.error({ error: errorMessage }, "网站图标上传失败");

			// 抛出业务异常，会被 Elysia 的 error 钩子捕获
			throw new BusinessError("图标处理失败，请检查文件格式或重试", {
				status: 500,
			});
		}
	}
}

export const configService = new ConfigService();
