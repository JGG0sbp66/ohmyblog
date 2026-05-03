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
}
