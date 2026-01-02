// src/routes/config.route.ts
import { Elysia } from "elysia";
import { configService } from "../services/config.service";
import { ConfigUpsertDTO } from "../dtos/config.dto";
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
                 * POST /config
                 * - 用于创建或更新配置
                 */
                .post("/", async ({ body }) => {
                    const config = await configService.upsert(body);

                    return {
                        message: "保存成功",
                        config,
                    };
                }, {
                    beforeHandle: ensureAdminIfExists,
                    detail: { summary: "创建或更新配置（POST）" },
                    body: ConfigUpsertDTO,
                })
                /**
                 * GET /config/:configKey
                 * - 获取单个配置
                 */
                .get(
                    "/:configKey",
                    async (
                        { params: { configKey }, user },
                    ) => {
                        const isAdmin = user?.role === "admin";

                        const config = await configService.getByKey(
                            configKey,
                            isAdmin,
                        );
                        return {
                            message: "获取成功",
                            config,
                        };
                    },
                    {
                        detail: { summary: "获取单个配置（GET）" },
                    },
                ),
    );
