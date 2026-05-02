// src/routes/email.route.ts
import { Elysia, t } from "elysia";
import { SMTPConfigUpsertDTO } from "../dtos/config.dto";
import { EmailLogQueryDTO, EmailTestDTO } from "../dtos/email.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { emailSenderService } from "../services/email/email-sender.service";
import { emailDispatchService } from "../services/email/email-dispatch.service";
import { emailLogDao } from "../daos/email-log.dao";

export const emailRoute = new Elysia({ name: "emailRoute" })
	.use(authPlugin)
	.group("/email", { detail: { tags: ["Email (邮件)"] } }, (app) =>
		app
			.post(
				"/test-smtp",
				async ({ body }) => {
					const result = await emailDispatchService.testSMTPConnection(body);
					return result;
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "测试 SMTP 服务器连接" },
					// 使用 SMTPConfigUpsertDTO 中的 configValue 部分作为请求体验证
					body: SMTPConfigUpsertDTO.properties.configValue,
				},
			)
			.post(
				"/send-test-email",
				async ({ body }) => {
					return emailSenderService.sendSMTPTestEmail(body.to);
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "发送 SMTP 测试邮件" },
					body: EmailTestDTO,
				},
			)
			// === 邮件日志推断类型（供前端使用） ===
			.get(
				"/unread-count",
				async () => {
					return await emailLogDao.countUnread();
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "获取未读邮件记录数" },
				},
			)
			// === 邮件发送记录列表（管理员） ===
			.get(
				"/logs",
				async ({ query }) => {
					return await emailLogDao.findAll(query);
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
				async ({ params }) => {
					const html = await emailSenderService.previewEmailLog(params.uuid);

					// 方案 B: 预览时自动标记为已读
					await emailLogDao.markAsRead(params.uuid);

					// 特判：直接返回 Response 对象以绕过 responsePlugin 的统一 JSON 包装
					// 否则 HTML 字符串会被包装成 { success: true, data: "<html>...</html>" }，导致 iframe 无法正常渲染
					return new Response(html, {
						headers: {
							"Content-Type": "text/html; charset=utf-8",
						},
					});
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
