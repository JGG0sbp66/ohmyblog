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
                    const data = body as typeof ConfigUpsertDTO.static;
                    const config = await configService.upsert(data);

                    return {
                        message: "保存成功",
                        config,
                    };
                }, {
                    beforeHandle: ensureAdminIfExists,
                    detail: { summary: "创建或更新配置（POST）" },
                    body: ConfigUpsertDTO,
                }),
    );
