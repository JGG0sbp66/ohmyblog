// src/dtos/email.dto.ts
import { type Static, t } from "elysia";

/** 当前支持的邮件模板类型，后续新增模板时在 Union 中追加 Literal */
export const EmailTemplateType = t.Union([t.Literal("smtp_test")], {
	description: "邮件模板类型",
});

export type TEmailTemplateType = Static<typeof EmailTemplateType>;

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
