// src/api/config.api.ts
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

/**
 * POST /api/config/upload-icon
 * 上传网站图标文件
 * @param file 这是一个 File 对象 (来自 <input type="file"> 或 Drag/Drop)
 */
export const uploadFavicon = (file: File) => {
    return unwrap(api.api.config["upload-icon"].post({
        icon: file,
    }));
};
