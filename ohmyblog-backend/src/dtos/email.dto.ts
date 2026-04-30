// src/dtos/email.dto.ts
import { type Static, t } from "elysia";

/** 当前支持的邮件模板类型，后续新增模板时在 Union 中追加 Literal */
export const EmailTemplateType = t.Union([t.Literal("smtp_test")], {
	description: "邮件模板类型",
});

export type TEmailTemplateType = Static<typeof EmailTemplateType>;

/** 邮件日志类型筛选（与 db/table/email-log.ts 的 emailLogTypes 保持同步） */
export const EmailLogTypeFilter = t.Union([
	t.Literal("smtp_test"),
	t.Literal("login_alert"),
	t.Literal("reset_password"),
]);

export const EmailLogStatusFilter = t.Union([
	t.Literal("success"),
	t.Literal("failed"),
]);

/** 邮件记录列表查询 */
export const EmailLogQueryDTO = t.Object({
	page: t.Optional(
		t.Numeric({ minimum: 1, default: 1, description: "页码，从 1 开始" }),
	),
	pageSize: t.Optional(
		t.Numeric({
			minimum: 1,
			maximum: 100,
			default: 20,
			description: "每页条数",
		}),
	),
	type: t.Optional(EmailLogTypeFilter),
	status: t.Optional(EmailLogStatusFilter),
});

export type TEmailLogQueryDTO = Static<typeof EmailLogQueryDTO>;

export const EmailSendDTO = t.Object({
	to: t.Array(
		t.String({
			format: "email",
			description: "收件人邮箱",
			error: "email.to_invalid",
		}),
		{
			minItems: 1,
			description: "收件人列表",
			error: "email.to_required",
		},
	),
	subject: t.Optional(
		t.String({
			maxLength: 200,
			description: "邮件主题",
			error: "email.subject_range",
		}),
	),
	content: t.Array(
		t.String({
			maxLength: 2000,
			description: "邮件正文段落",
			error: "email.content_invalid",
		}),
		{
			description: "邮件内容列表",
		},
	),
	/** 指定渲染模板，默认 smtp_test */
	template: t.Optional(EmailTemplateType),
});

export type TEmailSendDTO = Static<typeof EmailSendDTO>;
