// src/services/email.service.ts
import nodemailer from "nodemailer";
import type { TSMTPConfigUpsertDTO } from "../dtos/config.dto";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger.plugin";

class EmailService {
	private logger = systemLogger.child({ module: "EmailService" });

	/**
	 * 测试 SMTP 服务器连接
	 * @param smtpConfig SMTP 配置
	 * @returns 测试结果消息
	 */
	async testSMTPConnection(smtpConfig: TSMTPConfigUpsertDTO["configValue"]) {
		try {
			// 创建 nodemailer 传输器
			const transporter = nodemailer.createTransport({
				host: smtpConfig.host,
				port: smtpConfig.port,
				// 465 端口使用 SSL (连接时就加密)
				secure: smtpConfig.port === 465,
				auth: {
					user: smtpConfig.username,
					pass: smtpConfig.password,
				},
				// 587 端口强制要求 STARTTLS (先连接再升级到加密)
				requireTLS: smtpConfig.port === 587,
				// 超时设置: 10 秒
				connectionTimeout: 10000,
				greetingTimeout: 10000,
			});

			// 验证 SMTP 连接和认证信息
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
}

export const emailService = new EmailService();
