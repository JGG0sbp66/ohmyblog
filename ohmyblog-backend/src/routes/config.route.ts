import { Elysia } from "elysia";
import { configService } from "../services/config.service";
import { BusinessError } from "../plugins/errors";
import { ConfigCreateDTO, ConfigUpdateDTO } from "../dtos/config.dto";
import { authPlugin } from "../plugins/auth.plugin";
import { ensureAdminIfExists } from "../plugins/adminGuard";

// TODO: 后续再新增删除，查找接口，目前只支持更新
export const configRoute = new Elysia({ name: "configRoute" })
    .use(authPlugin).group(
        "/config",
        { detail: { tags: ["Config (配置)"] } },
        (app) =>
            app
                /**
                 * PATCH /config
                 * - 用于创建配置（需要提供 configKey）
                 */
                .patch("/", async ({ body, set }) => {
                    const data = body as typeof ConfigCreateDTO.static;
                    if (!data.configKey) {
                        throw new BusinessError("configKey 不能为空", {
                            status: 400,
                        });
                    }
                    if (data.configValue === undefined) {
                        throw new BusinessError("configValue 不能为空", {
                            status: 400,
                        });
                    }

                    const created = await configService.create(data as any);
                    set.status = 201;
                    return {
                        message: "配置已创建",
                        config: created,
                    };
                }, {
                    beforeHandle: ensureAdminIfExists,
                    detail: { summary: "创建配置（PATCH）" },
                    body: ConfigCreateDTO,
                })
                /**
                 * PATCH /config/:configKey
                 * - 根据 key 更新指定配置
                 */
                .patch("/:configKey", async ({ params, body }) => {
                    const data = body as typeof ConfigUpdateDTO.static;
                    const hasPayload = data.configValue !== undefined ||
                        data.description !== undefined ||
                        data.isPublic !== undefined;
                    if (!hasPayload) {
                        throw new BusinessError("至少提供一个可更新字段", {
                            status: 400,
                        });
                    }

                    const updated = await configService.update(
                        params.configKey,
                        data,
                    );
                    return {
                        message: "配置已更新",
                        config: updated,
                    };
                }, {
                    beforeHandle: ensureAdminIfExists,
                    detail: { summary: "更新配置（PATCH）" },
                    body: ConfigUpdateDTO,
                }),
    );
