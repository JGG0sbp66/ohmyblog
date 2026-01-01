import { configDao, ConfigUpdate, NewConfig } from "../dao/configDao";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger";

class ConfigService {
    private logger = systemLogger.child({ module: "ConfigService" });

    /**
     * 列出配置，可选过滤公开字段
     */
    async list(options?: { isPublic?: boolean }) {
        return await configDao.listConfigs(options);
    }

    /**
     * 获取单个配置，默认仅用于后台调用
     */
    async getByKey(configKey: string) {
        const item = await configDao.findByKey(configKey);
        if (!item) {
            throw new BusinessError("配置不存在", { status: 404 });
        }
        return item;
    }

    /**
     * 列出公开配置
     */
    async listPublic() {
        return await configDao.listPublicConfigs();
    }

    /**
     * 新建配置，键名冲突则返回 409
     */
    async create(data: NewConfig) {
        const exists = await configDao.findByKey(data.configKey);
        if (exists) {
            throw new BusinessError("配置键已存在", { status: 409 });
        }
        const created = await configDao.createConfig(data);
        this.logger.info({ configKey: created.configKey }, "配置已创建");
        return created;
    }

    /**
     * 更新配置，不存在则 404
     */
    async update(configKey: string, data: ConfigUpdate) {
        const updated = await configDao.updateByKey(configKey, data);
        if (!updated) {
            throw new BusinessError("配置不存在", { status: 404 });
        }
        this.logger.info({ configKey }, "配置已更新");
        return updated;
    }

    /**
     * 删除配置，不存在则 404
     */
    async delete(configKey: string) {
        const removed = await configDao.deleteByKey(configKey);
        if (!removed) {
            throw new BusinessError("配置不存在", { status: 404 });
        }
        this.logger.info({ configKey }, "配置已删除");
        return removed;
    }
}

export const configService = new ConfigService();

