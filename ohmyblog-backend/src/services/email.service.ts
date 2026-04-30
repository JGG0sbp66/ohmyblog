// src/services/email.service.ts
import nodemailer from "nodemailer";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { configDao } from "../daos/config.dao";
import type {
	TAppearanceConfigUpsertDTO,
	TSMTPConfigUpsertDTO,
} from "../dtos/config.dto";
import type { TEmailSendDTO } from "../dtos/email.dto";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
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
			TAppearanceConfigUpsertDTO["configValue"] | null;
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

	/** 使用已就绪的配置实际投递邮件 */
	private async dispatch({
		to,
		subject,
		html,
		smtpConfig,
		siteTitle,
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
			return { message: "邮件发送成功", count: to.length };
		} catch (error) {
			this.logger.error({ error }, "邮件发送失败");
			throw new BusinessError(`邮件发送失败: ${(error as Error).message}`, {
				status: 500,
			});
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

		const html = renderToStaticMarkup(
			createElement(SMTPTestEmail, {
				siteTitle,
				siteFooter,
				senderEmail,
				sentAt,
				greeting: `你好，${adminName}！`,
				testMessage: data.content[0],
				footerNote: data.content[1],
				hue,
			}),
		);

		return this.dispatch({
			to: data.to,
			subject: data.subject || `这是一封来自 ${siteTitle} 的测试邮件`,
			html,
			smtpConfig,
			siteTitle,
		});
	}
}

export const emailService = new EmailService();
