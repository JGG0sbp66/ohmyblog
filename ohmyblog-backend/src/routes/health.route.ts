import { Elysia } from "elysia";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { healthService } from "../services/health.service";
import { updateService } from "../services/update.service";

export const healthRoute = new Elysia({ name: "healthRoute" })
	.use(authPlugin)
	.group(
		"/health",
		{
			detail: {
				tags: ["健康检查"],
			},
		},
		(app) =>
			app
				.get(
					"",
					async () => {
						return await healthService.getSystemStatus();
					},
					{
						detail: {
							summary: "系统健康检查",
							description: "获取系统健康状态，包括当前运行的版本信息",
						},
					},
				)
				.get("/update", () => updateService.check(healthService.getVersion()), {
					beforeHandle: ensureAdminIfExists,
					detail: {
						summary: "检查系统更新",
						description: "比较当前运行版本与最新的 GitHub Release",
					},
				}),
	);
