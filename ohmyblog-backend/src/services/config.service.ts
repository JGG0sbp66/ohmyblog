// src/services/config.service.ts
import { configDao, type NewConfig } from "../dao/config.dao";
import type { TConfigUpsertDTO } from "../dtos/config.dto";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger.plugin";

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
}

export const configService = new ConfigService();
