import { api, unwrap } from "./client";
import type { TConfigUpsertDTO } from "@server/dtos/config.dto";

/**
 * GET /api/config
 * 读取配置项
 */
export const getConfig = (configKey: string) =>
    unwrap(api.api.config({ configKey }).get());

/**
 * POST /api/config
 * 创建或更新配置项
 */
export const upsertConfig = (
    data: TConfigUpsertDTO,
) => {
    return unwrap(api.api.config.post(data));
};
