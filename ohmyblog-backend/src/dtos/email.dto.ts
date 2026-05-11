// src/dtos/email.dto.ts
import { type Static, t } from "elysia";
import {
	emailLogStatuses,
	emailLogTypes,
} from "../../db/constants/email-log.constants";
import { tStringEnum } from "../utils/typebox";

/** 邮件日志类型筛选 */
export const EmailLogTypeFilter = tStringEnum(emailLogTypes);
export const EmailLogStatusFilter = tStringEnum(emailLogStatuses);

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
	isRead: t.Optional(t.Boolean()),
});

export type TEmailLogQueryDTO = Static<typeof EmailLogQueryDTO>;

/** 邮件连通性测试请求 */
export const EmailTestDTO = t.Object({
	to: t.Array(t.String({ format: "email", description: "收件人邮箱" }), {
		minItems: 1,
		description: "测试邮件收件人列表",
	}),
});

export type TEmailTestDTO = Static<typeof EmailTestDTO>;

/** 基础邮件模板参数 DTO (公共字段) */
const BaseEmailParamsDTO = {
	siteTitle: t.Optional(t.String()),
	siteFooter: t.Optional(t.String()),
	greeting: t.Optional(t.String()),
	/** OKLCH hue (0–360) */
	hue: t.Optional(t.Number()),
};

/** SMTP 测试邮件参数 DTO */
export const SMTPTestEmailParamsDTO = t.Object({
	...BaseEmailParamsDTO,
	testMessage: t.Optional(t.String()),
	footerNote: t.Optional(t.String()),
	senderEmail: t.String({ description: "发件人邮箱" }),
	sentAt: t.String({ description: "发送时间戳" }),
});

/** 登录告警邮件参数 DTO */
export const LoginAlertEmailParamsDTO = t.Object({
	...BaseEmailParamsDTO,
	/** 当前登录的 IP */
	currentIp: t.String(),
	/** 当前登录的地理位置（如 "中国 / 北京"） */
	currentLocation: t.String(),
	/** 上次登录的地理位置 */
	previousLocation: t.String(),
	/** 登录时间字符串 */
	loginAt: t.String(),
});

/** 密码重置邮件参数 DTO */
export const ResetPasswordEmailParamsDTO = t.Object({
	...BaseEmailParamsDTO,
	/** 6 位验证码 */
	code: t.String(),
	/** 验证码有效期（分钟） */
	expiresInMinutes: t.Number(),
	/** 请求 IP */
	ip: t.String(),
	/** 请求地理位置 */
	location: t.String(),
});

export type TSMTPTestEmailParams = Static<typeof SMTPTestEmailParamsDTO>;
export type TLoginAlertEmailParams = Static<typeof LoginAlertEmailParamsDTO>;
export type TResetPasswordEmailParams = Static<
	typeof ResetPasswordEmailParamsDTO
>;

/** 友链申请通知邮件参数（发送给管理员） */
export interface TFriendLinkApplyNotifyEmailParams {
	siteTitle?: string;
	siteFooter?: string;
	greeting?: string;
	hue?: number;
	siteName: string;
	siteUrl: string;
	siteDescription?: string;
	siteTags?: string[];
	applicantEmail?: string;
}

/** 友链申请确认邮件参数（发送给申请人，告知已收到申请） */
export interface TFriendLinkApplyConfirmedEmailParams {
	siteTitle?: string;
	siteFooter?: string;
	hue?: number;
	applicantSiteName: string;
}

/** 友链审批结果邮件参数（发送给申请人） */
export interface TFriendLinkResultEmailParams {
	siteTitle?: string;
	siteFooter?: string;
	hue?: number;
	applicantSiteName: string;
	result: "approved" | "rejected";
	rejectReason?: string;
}
