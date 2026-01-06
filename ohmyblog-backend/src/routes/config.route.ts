// src/routes/config.route.ts
import { Elysia } from "elysia";
import { configService } from "../services/config.service";
import { ConfigUpsertDTO } from "../dtos/config.dto";
import { authPlugin } from "../plugins/auth.plugin";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { UploadIconDTO } from "../dtos/config.dto";

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
                )
                /**
                 * POST /config/upload-icon
                 * - 上传网站图标 (Favicon)
                 */
                .post(
                    "/upload-icon",
                    async ({ body: { icon } }) => {
                        const result = await configService.uploadFavicon(icon);

                        return {
                            message: "图标上传成功",
                            ...result,
                        };
                    },
                    {
                        beforeHandle: ensureAdminIfExists,
                        body: UploadIconDTO,
                        detail: {
                            summary: "上传网站图标 (POST)",
                            
                            description:
                                "仅限管理员操作，上传后自动处理为 128x128 的 PNG 格式",
                        },
                    },
                ),
    );
