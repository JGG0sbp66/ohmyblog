// src/routes/config.route.ts
import { Elysia } from "elysia";
import { ConfigUpsertDTO } from "../dtos/config.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { configService } from "../services/config.service";
import { isDemoUser } from "../utils/demo";

export const configRoute = new Elysia({ name: "configRoute" })
	.use(authPlugin)
	.group("/config", { detail: { tags: ["Config (配置)"] } }, (app) =>
		app
			/**
			 * POST /config
			 * - 用于创建或更新配置
			 */
			.post(
				"/",
				async ({ body }) => {
					const config = await configService.upsert(body);

					return {
						message: "保存成功",
						config,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "创建或更新配置（POST）" },
					body: ConfigUpsertDTO,
				},
			)
			/**
			 * GET /config/:configKey
			 * - 获取单个配置
			 */
			.get(
				"/:configKey",
				async ({ params: { configKey }, user }) => {
					// 演示模式的虚拟身份虽然是 admin，但不该越过公开白名单限制
					// 读 smtp 这类含密码的私有配置，此处按未登录访客处理
					const isAdmin = user?.role === "admin" && !isDemoUser(user);

					const config = await configService.getByKey(configKey, isAdmin);
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
