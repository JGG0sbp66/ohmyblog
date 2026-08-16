// src/services/email/email-dispatch.service.ts
import type {
	TEmailLogStatus,
	TEmailLogType,
} from "../../../db/constants/email-log.constants";
import { emailLogDao } from "../../daos/email-log.dao";
import type { TSMTPConfigUpsertDTO } from "../../dtos/config.dto";
import { BusinessError } from "../../plugins/errors";
import { logger } from "../../plugins/logger.plugin";
import type { DispatchOptions } from "./types";

class EmailDispatchService {
	private logger = logger.withTag("EmailDispatchService");

	/**
	 * 根据 SMTP 配置创建 nodemailer 传输器
	 *
	 * nodemailer 是个包含完整 SMTP 协议实现的较重模块，但博客绝大多数
	 * 时间不会发邮件。采用 lazy import 避免服务启动时把它 evaluate 进常驻
	 * JS 堆，仅在首次发邮件 / 测试 SMTP 连接时加载。
	 */
	private async createTransporter(
		smtpConfig: TSMTPConfigUpsertDTO["configValue"],
	) {
		const { default: nodemailer } = await import("nodemailer");
		return nodemailer.createTransport({
			host: smtpConfig.host,
			port: smtpConfig.port,
			// 端口语义：465 = 隐式 TLS（一连上就握手），587 = STARTTLS（先明文
			// 打招呼再升级），25 = 明文中继。secure 只在隐式 TLS 下为 true ——
			// 此前写成 port !== 25，587 也被当隐式 TLS，对着说明文的端口发
			// TLS 握手必然失败；requireTLS 只在 secure:false 时有意义，那时
			// 它才是 587 的正确开关
			secure: smtpConfig.port === 465,
			auth: { user: smtpConfig.username, pass: smtpConfig.password },
			requireTLS: smtpConfig.port === 587,
			connectionTimeout: 10000,
			greetingTimeout: 10000,
		});
	}

	/**
	 * 统一的邮件投递出口
	 * @param options 投递选项（包含收件人、主题、HTML、配置、类型等）
	 * @returns 发送结果及成功数量
	 */
	async dispatch({
		to,
		subject,
		html,
		smtpConfig,
		siteTitle,
		type,
		params,
	}: DispatchOptions): Promise<{ message: string; count?: number }> {
		const transporter = await this.createTransporter(smtpConfig);
		const fromAddress = smtpConfig.senderEmail || smtpConfig.username;
		// display-name 消毒：from 头是字符串拼接（"名字" <地址>），名字里带
		// 引号会提前闭合、把余下文本拆成额外的地址段 —— 与 SQL 注入同构，
		// 把未消毒数据拼进有语法结构的字符串。真正的换行注入（CRLF 伪造
		// 头）nodemailer 会拦，这里管的是引号/尖括号逃逸
		const fromName = (smtpConfig.senderName || siteTitle).replace(
			/["\\<>]/g,
			"",
		);
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
				fromName,
				fromEmail: fromAddress,
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
				fromName,
				fromEmail: fromAddress,
			});
			throw new BusinessError(`邮件发送失败: ${errorMessage}`, {
				status: 500,
			});
		}
	}

	/**
	 * 写入 email_log 表
	 * @param data 日志记录详情
	 */
	private async writeLog(data: {
		type: TEmailLogType;
		to: string[];
		subject: string;
		status: TEmailLogStatus;
		errorMessage?: string;
		params?: Record<string, unknown>;
		fromName: string;
		fromEmail: string;
	}) {
		try {
			await emailLogDao.create({
				type: data.type,
				fromName: data.fromName,
				fromEmail: data.fromEmail,
				to: data.to.join(", "),
				subject: data.subject,
				status: data.status,
				errorMessage: data.errorMessage ?? null,
				params: data.params ?? null,
			});
		} catch (err) {
			this.logger.error({ err }, "写入 email_log 失败");
		}
	}

	/**
	 * 测试 SMTP 服务器连接
	 * @param smtpConfig SMTP 配置记录
	 * @returns 测试成功消息
	 */
	async testSMTPConnection(smtpConfig: TSMTPConfigUpsertDTO["configValue"]) {
		try {
			const transporter = await this.createTransporter(smtpConfig);
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

export const emailDispatchService = new EmailDispatchService();
