// src/routes/email.route.ts
import { Elysia } from "elysia";
import { SMTPConfigUpsertDTO } from "../dtos/config.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { emailService } from "../services/email.service";

export const emailRoute = new Elysia({ name: "emailRoute" })
	.use(authPlugin)
	.group("/email", { detail: { tags: ["Email (邮件)"] } }, (app) =>
		app.post(
			"/test-smtp",
			async ({ body }) => {
				const result = await emailService.testSMTPConnection(body);
				return result;
			},
			{
				beforeHandle: ensureAdminIfExists,
				detail: { summary: "测试 SMTP 服务器连接" },
				// 直接使用 SMTPConfigUpsertDTO 中的 configValue 部分作为请求体验证
				body: SMTPConfigUpsertDTO.properties.configValue,
			},
		),
	);
