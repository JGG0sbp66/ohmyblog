// src/routes/email.route.ts
import { Elysia, t } from "elysia";
import { SMTPConfigUpsertDTO } from "../dtos/config.dto";
import { EmailLogQueryDTO, EmailSendDTO } from "../dtos/email.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { emailService } from "../services/email.service";

export const emailRoute = new Elysia({ name: "emailRoute" })
	.use(authPlugin)
	.group("/email", { detail: { tags: ["Email (邮件)"] } }, (app) =>
		app
			.post(
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
			)
			.post(
				"/send",
				async ({ body }) => {
					const result = await emailService.sendEmail(body);
					return result;
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "发送通知邮件" },
					body: EmailSendDTO,
				},
			)
			// === 邮件发送记录列表（管理员） ===
			.get(
				"/logs",
				async ({ query }) => {
					return await emailService.getEmailLogs(query);
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "查询邮件发送记录" },
					query: EmailLogQueryDTO,
				},
			)
			// === 邮件预览（重新渲染 HTML）===
			// 直接返回 text/html，前端可用 <iframe :src="..."> 内联渲染
			.get(
				"/logs/:uuid/preview",
				async ({ params, set }) => {
					const html = await emailService.previewEmailLog(params.uuid);
					set.headers["content-type"] = "text/html; charset=utf-8";
					return html;
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: {
						summary: "预览邮件原始内容（HTML）",
						description:
							"使用记录中保存的模板参数快照重新渲染邮件正文，便于在管理后台直观查看。",
					},
					params: t.Object({ uuid: t.String() }),
				},
			),
	);
