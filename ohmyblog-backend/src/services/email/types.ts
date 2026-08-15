// src/services/email/types.ts

import type { TEmailLogType } from "../../../db/constants/email-log.constants";
import type { TSMTPConfigUpsertDTO } from "../../dtos/config.dto";

export interface SiteConfig {
	title: string;
	footer: string;
}

export interface DispatchOptions {
	to: string[];
	subject: string;
	html: string;
	smtpConfig: TSMTPConfigUpsertDTO["configValue"];
	siteTitle: string;
	/** 邮件类型，用于落库 email_log */
	type: TEmailLogType;
	/** 模板关键参数快照（用于后台展示和预览重渲染），可选 */
	params?: Record<string, unknown>;
}

export interface SendLoginAlertParams {
	to: string;
	currentIp: string;
	/** 上次登录 IP */
	previousIp: string;
	loginAt: Date;
}

export interface SendResetPasswordParams {
	to: string;
	expiresInMinutes: number;
	ip: string;
	/**
	 * 指定要发送的验证码。省略时内部生成一个新的。
	 *
	 * 传值的场景是「重发」：库里已有一个未过期的码，此时必须发原来那个，
	 * 不能换新的 —— 换码会把它已累计的失败次数一起清零，等于把
	 * RESET_PASSWORD_MAX_ATTEMPTS 变成可以靠反复申请无限刷新的软限制。
	 */
	code?: string;
}
