// src/services/email.service.ts
//
// 邮件服务层。负责：
//   1. 读取 SMTP / 外观 / 站点配置
//   2. 渲染 React 邮件模板为 HTML
//   3. 通过 nodemailer 发送
//   4. 发送后自动向 email_log 写入记录（无论成败）
//
// 新增一种邮件模板的完整流程：
//   1. 在 src/templates 下新建一个 *.tsx React Email 模板
//   2. 在 db/table/email-log.ts 的 emailLogTypes 中补一个枚举值
//   3. 在本文件新增一个 send*Email() 方法，调用 dispatch 并带上 type / params
//   4. 如果需要让前台【发送邮件】接口可选该模板，同步扩展 email.dto.ts 的 EmailTemplateType
import { render } from "@react-email/components";
import nodemailer from "nodemailer";
import { createElement } from "react";
import type { TEmailLogType } from "../../db/constants/email-log.constants";
import { configDao } from "../daos/config.dao";
import { emailLogDao } from "../daos/email-log.dao";
import type {
	TAppearanceConfigUpsertDTO,
	TSMTPConfigUpsertDTO,
} from "../dtos/config.dto";
import type { TEmailSendDTO } from "../dtos/email.dto";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import { LoginAlertEmail } from "../templates/LoginAlertEmail";
import { ResetPasswordEmail } from "../templates/ResetPasswordEmail";
import { SMTPTestEmail } from "../templates/SMTPTestEmail";

interface SiteConfig {
	title: string;
	footer: string;
}

interface DispatchOptions {
	to: string[];
	subject: string;
	html: string;
	smtpConfig: TSMTPConfigUpsertDTO["configValue"];
	siteTitle: string;
	/** 邮件类型，用于落库 email_log */
	type: TEmailLogType;
	/** 模板关键参数快照（用于后台展示和预览重渲染），可选 */
	params?: Record<string, unknown>;
	/** 触发来源（user uuid 或 'system'），可选 */
	triggeredBy?: string | null;
	/** 触发来源 IP，可选 */
	ip?: string | null;
}

export interface SendLoginAlertParams {
	to: string;
	adminName: string;
	currentIp: string;
	currentLocation: string;
	previousLocation: string;
	loginAt: Date;
	triggeredBy: string;
}

export interface SendResetPasswordParams {
	to: string;
	adminName: string;
	code: string;
	expiresInMinutes: number;
	triggeredBy: string;
	ip?: string | null;
}

class EmailService {
	private logger = logger.withTag("EmailService");

	/**
	 * 根据 SMTP 配置创建 nodemailer 传输器
	 * 只要不是 25 端口就启用安全连接，587 端口强制 STARTTLS
	 */
	private createTransporter(smtpConfig: TSMTPConfigUpsertDTO["configValue"]) {
		return nodemailer.createTransport({
			host: smtpConfig.host,
			port: smtpConfig.port,
			secure: smtpConfig.port !== 25,
			auth: { user: smtpConfig.username, pass: smtpConfig.password },
			requireTLS: smtpConfig.port === 587,
			connectionTimeout: 10000,
			greetingTimeout: 10000,
		});
	}

	/** 读取并校验数据库中的 SMTP 配置 */
	private async getSmtpConfig(): Promise<TSMTPConfigUpsertDTO["configValue"]> {
		const record = await configDao.findByKey("smtp");
		if (!record?.configValue) {
			throw new BusinessError("SMTP 配置不存在，请先完成邮件服务配置", {
				status: 400,
			});
		}
		const config = record.configValue as TSMTPConfigUpsertDTO["configValue"];
		if (!config.enabled) {
			throw new BusinessError("SMTP 服务未启用，请先在设置中开启邮件服务", {
				status: 400,
			});
		}
		return config;
	}

	/** 读取外观配置（hue），供模板使用 */
	private async getAppearanceConfig(): Promise<{ hue: number }> {
		const record = await configDao.findByKey("appearance");
		const raw = record?.configValue as
			| TAppearanceConfigUpsertDTO["configValue"]
			| null;
		return { hue: raw?.hue ?? 250 };
	}

	/** 读取站点信息（标题、页脚），供模板使用 */
	private async getSiteConfig(): Promise<SiteConfig> {
		const record = await configDao.findByKey("site_info");
		const raw = record?.configValue as {
			title?: string;
			footer?: string;
		} | null;
		return {
			title: raw?.title ?? "ohmyblog",
			footer: raw?.footer ?? "",
		};
	}

	/**
	 * 统一的邮件投递出口，所有 send*Email 方法都归集到这里。
	 *
	 * - 调用者只需准备好 HTML 和元数据，dispatch 负责发送 + 落库两件事
	 * - 发送成功 → 写一条 status=success 的 email_log
	 * - 发送失败 → 写一条 status=failed + errorMessage 的 email_log，然后重抛 BusinessError
	 * - email_log 写入本身出错不会影响主流程（参见 writeLog）
	 */
	private async dispatch({
		to,
		subject,
		html,
		smtpConfig,
		siteTitle,
		type,
		params,
		triggeredBy,
		ip,
	}: DispatchOptions): Promise<{ message: string; count?: number }> {
		const transporter = this.createTransporter(smtpConfig);
		const fromAddress = smtpConfig.senderEmail || smtpConfig.username;
		const fromName = smtpConfig.senderName || siteTitle;
		try {
			await transporter.sendMail({
				from: `"${fromName}" <${fromAddress}>`,
				to: to.join(", "),
				subject,
				html,
			});
			this.logger.info({ to }, "邮件发送成功");
			await this.writeLog({
				type,
				to,
				subject,
				status: "success",
				params,
				triggeredBy,
				ip,
			});
			return { message: "邮件发送成功", count: to.length };
		} catch (error) {
			const errorMessage = (error as Error).message;
			this.logger.error({ error }, "邮件发送失败");
			await this.writeLog({
				type,
				to,
				subject,
				status: "failed",
				errorMessage,
				params,
				triggeredBy,
				ip,
			});
			throw new BusinessError(`邮件发送失败: ${errorMessage}`, {
				status: 500,
			});
		}
	}

	/**
	 * 写入 email_log 表。捕获自身的任何异常、只记错不重抛。
	 *
	 * 原因：邮件已经发送出去了，写日志是审计需求，不能因为表写入失败
	 * 就向调用者报错（那会让前端以为邮件发失败）。
	 * 同理，失败场景下写日志也不能压去原始错误。
	 */
	private async writeLog(data: {
		type: TEmailLogType;
		to: string[];
		subject: string;
		status: "success" | "failed";
		errorMessage?: string;
		params?: Record<string, unknown>;
		triggeredBy?: string | null;
		ip?: string | null;
	}) {
		try {
			await emailLogDao.create({
				type: data.type,
				to: data.to.join(", "),
				subject: data.subject,
				status: data.status,
				errorMessage: data.errorMessage ?? null,
				params: data.params ?? null,
				triggeredBy: data.triggeredBy ?? null,
				ip: data.ip ?? null,
			});
		} catch (err) {
			this.logger.error({ err }, "写入 email_log 失败");
		}
	}

	/**
	 * 测试 SMTP 服务器连接
	 * @param smtpConfig SMTP 配置
	 * @returns 测试结果消息
	 */
	async testSMTPConnection(smtpConfig: TSMTPConfigUpsertDTO["configValue"]) {
		try {
			const transporter = this.createTransporter(smtpConfig);

			// 验证 SMTP 连接和认证信息
			// 注意：此验证仅测试服务器连接和账号认证是否可用，不验证发件人地址 (senderEmail) 的有效性。
			// 对于 QQ/Gmail 等个人邮箱服务商，如果 senderEmail 与 username 不一致，
			// 虽然此处验证能通过，但实际发送邮件时可能会报 501 错误。
			// 建议：个人邮箱留空 senderEmail 或填写与 username 相同的地址；域名邮件服务（如 Resend）无此限制。
			await transporter.verify();

			this.logger.info({ host: smtpConfig.host }, "SMTP 连接测试成功");
			return { message: "SMTP 服务器连接成功" };
		} catch (error) {
			this.logger.error({ error }, "SMTP 连接测试失败");
			throw new BusinessError(
				`SMTP 服务器连接失败: ${(error as Error).message}`,
				{ status: 400 },
			);
		}
	}

	/**
	 * 统一邮件发送入口，根据 data.template 分派至对应模板方法
	 * 新增模板时: 1. 在 EmailTemplateType Union 追加 Literal
	 *            2. 新增 private send*Email 方法
	 *            3. 在此 switch 补一个 case
	 */
	async sendEmail(data: TEmailSendDTO) {
		switch (data.template ?? "smtp_test") {
			default:
				return this.sendSMTPTestEmail(data);
		}
	}

	/** 发送 SMTP 测试通知邮件（SMTPTestEmail 模板），包含连接详情卡片 */
	private async sendSMTPTestEmail(data: TEmailSendDTO) {
		const smtpConfig = await this.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } = await this.getSiteConfig();

		const personalRecord = await configDao.findByKey("personal_info");
		const adminName =
			(personalRecord?.configValue as { username?: string } | null)?.username ??
			"Admin";

		const { hue } = await this.getAppearanceConfig();

		const senderEmail = smtpConfig.senderEmail || smtpConfig.username;
		const sentAt = new Date().toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const templateProps = {
			siteTitle,
			siteFooter,
			senderEmail,
			sentAt,
			greeting: `你好，${adminName}！`,
			testMessage: data.content[0],
			footerNote: data.content[1],
			hue,
		};

		const html = await render(createElement(SMTPTestEmail, templateProps));

		return this.dispatch({
			to: data.to,
			subject: data.subject || `这是一封来自 ${siteTitle} 的测试邮件`,
			html,
			smtpConfig,
			siteTitle,
			type: "smtp_test",
			params: templateProps,
		});
	}

	/** 发送异地登录提醒邮件 */
	async sendLoginAlertEmail(params: SendLoginAlertParams) {
		const smtpConfig = await this.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } = await this.getSiteConfig();
		const { hue } = await this.getAppearanceConfig();

		const loginAtStr = params.loginAt.toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		});

		const templateProps = {
			siteTitle,
			siteFooter,
			greeting: `你好，${params.adminName}！`,
			currentIp: params.currentIp,
			currentLocation: params.currentLocation,
			previousLocation: params.previousLocation,
			loginAt: loginAtStr,
			hue,
		};

		const html = await render(createElement(LoginAlertEmail, templateProps));

		return this.dispatch({
			to: [params.to],
			subject: `[${siteTitle}] 检测到来自新国家/地区的登录`,
			html,
			smtpConfig,
			siteTitle,
			type: "login_alert",
			params: templateProps,
			triggeredBy: params.triggeredBy,
			ip: params.currentIp,
		});
	}

	/**
	 * 分页查询邮件发送历史（管理后台使用）
	 * @param query 分页 + 类型 + 状态过滤
	 */
	async getEmailLogs(query: {
		page?: number;
		pageSize?: number;
		type?: TEmailLogType;
		status?: "success" | "failed";
	}) {
		return emailLogDao.findAll(query);
	}

	/**
	 * 重新渲染历史邮件的 HTML（管理后台预览用）
	 *
	 * 实现方式：根据日志中保存的 type 选择对应模板，把 params 快照作为 props 重新跑一次渲染。
	 * 因此模板必须设计为「纯函数 + props 自带默认值」，否则缺字段会渲染异常。
	 *
	 * 新增模板时记得在下方 switch 里追加分支。
	 */
	async previewEmailLog(uuid: string): Promise<string> {
		const log = await emailLogDao.findById(uuid);
		if (!log) {
			throw new BusinessError("邮件记录不存在", { status: 404 });
		}
		// params 是 JSON 字段，类型在 drizzle 里是 unknown，这里按 type 分支兜底
		const params = (log.params ?? {}) as Record<string, unknown>;
		switch (log.type) {
			case "smtp_test":
				return render(createElement(SMTPTestEmail, params));
			case "login_alert":
				return render(createElement(LoginAlertEmail, params));
			case "reset_password":
				return render(createElement(ResetPasswordEmail, params));
			default: {
				// 安全网：未来若新增 type 但忘了在这里加分支，会触发编译错误
				const _exhaustive: never = log.type;
				throw new BusinessError(`未知邮件类型: ${_exhaustive}`, { status: 500 });
			}
		}
	}

	/** 发送密码重置验证码邮件 */
	async sendResetPasswordEmail(params: SendResetPasswordParams) {
		const smtpConfig = await this.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } = await this.getSiteConfig();
		const { hue } = await this.getAppearanceConfig();

		const templateProps = {
			siteTitle,
			siteFooter,
			greeting: `你好，${params.adminName}！`,
			code: params.code,
			expiresInMinutes: params.expiresInMinutes,
			hue,
		};

		const html = await render(createElement(ResetPasswordEmail, templateProps));

		return this.dispatch({
			to: [params.to],
			subject: `[${siteTitle}] 密码重置验证码`,
			html,
			smtpConfig,
			siteTitle,
			type: "reset_password",
			params: templateProps,
			triggeredBy: params.triggeredBy,
			ip: params.ip ?? null,
		});
	}
}

export const emailService = new EmailService();
