// src/services/email/email-sender.service.ts
import { randomInt } from "node:crypto";
import { render } from "@react-email/components";
import { createElement } from "react";
import { emailLogDao } from "../../daos/email-log.dao";
import type {
	TLoginAlertEmailParams,
	TResetPasswordEmailParams,
	TSMTPTestEmailParams,
} from "../../dtos/email.dto";
import { BusinessError } from "../../plugins/errors";
import { type GeoInfo, geoService } from "../../services/geo.service";
import { LoginAlertEmail } from "../../templates/LoginAlertEmail";
import { ResetPasswordEmail } from "../../templates/ResetPasswordEmail";
import { SMTPTestEmail } from "../../templates/SMTPTestEmail";
import { emailConfigService } from "./email-config.service";
import { emailDispatchService } from "./email-dispatch.service";
import type { SendLoginAlertParams, SendResetPasswordParams } from "./types";

class EmailSenderService {
	/**
	 * 发送 SMTP 测试通知邮件
	 * @param to 收件人邮箱列表
	 * @returns 发送结果
	 */
	async sendSMTPTestEmail(to: string[]) {
		const smtpConfig = await emailConfigService.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } =
			await emailConfigService.getSiteConfig();
		const adminName = await emailConfigService.getAdminName();
		const { hue } = await emailConfigService.getAppearanceConfig();

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
			greeting: `你好，${adminName}！`,
			senderEmail,
			sentAt,
			hue,
		};

		const html = await render(createElement(SMTPTestEmail, templateProps));

		return emailDispatchService.dispatch({
			to,
			subject: `这是一封来自 ${siteTitle} 的测试邮件`,
			html,
			smtpConfig,
			siteTitle,
			type: "smtp_test",
			params: templateProps,
		});
	}

	/**
	 * 登录告警：仅在检测到异地登录时发送邮件
	 * @param params 登录告警简要参数
	 */
	async maybeSendLoginAlert(params: SendLoginAlertParams) {
		// 1. 同时解析两个 IP 的地理位置
		const [currGeo, prevGeo] = await Promise.all([
			geoService.lookup(params.currentIp),
			geoService.lookup(params.previousIp),
		]);

		// 2. 异地判定逻辑：直接对比城市即可
		// 特判：如果任一 IP 解析出的城市为 null（未知），则保守起见不触发告警
		if (!currGeo.city || !prevGeo.city) return;

		// 城市不同则判定为异地
		if (currGeo.city !== prevGeo.city) {
			return this.sendLoginAlertEmail(params, currGeo, prevGeo);
		}
	}

	/**
	 * 发送异地登录提醒邮件
	 * @param params 登录告警简要参数
	 * @param currGeo 当前位置信息
	 * @param prevGeo 上次位置信息
	 * @returns 发送结果
	 */
	async sendLoginAlertEmail(
		params: SendLoginAlertParams,
		currGeo: GeoInfo,
		prevGeo: GeoInfo,
	) {
		const smtpConfig = await emailConfigService.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } =
			await emailConfigService.getSiteConfig();
		const { hue } = await emailConfigService.getAppearanceConfig();

		// 1. 获取管理员名称
		const adminName = await emailConfigService.getAdminName();

		// 2. 格式化位置字符串
		const currentLocation = geoService.formatLocation(currGeo);
		const previousLocation = geoService.formatLocation(prevGeo);

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
			greeting: `你好，${adminName}！`,
			currentIp: params.currentIp,
			currentLocation,
			previousLocation,
			loginAt: loginAtStr,
			hue,
		};

		const html = await render(createElement(LoginAlertEmail, templateProps));

		return emailDispatchService.dispatch({
			to: [params.to],
			subject: `[${siteTitle}] 检测到来自新国家/地区的登录`,
			html,
			smtpConfig,
			siteTitle,
			type: "login_alert",
			params: templateProps,
		});
	}

	/**
	 * 发送密码重置验证码邮件
	 * @param params 密码重置参数（不包含验证码，内部自动生成）
	 * @returns 包含生成的验证码和发送结果的对象
	 */
	async sendResetPasswordEmail(params: SendResetPasswordParams) {
		const smtpConfig = await emailConfigService.getSmtpConfig();
		const { title: siteTitle, footer: siteFooter } =
			await emailConfigService.getSiteConfig();
		const { hue } = await emailConfigService.getAppearanceConfig();

		// 1. 获取管理员名称
		const adminName = await emailConfigService.getAdminName();

		// 2. 内部生成 6 位加密安全验证码
		const code = String(randomInt(100000, 1000000));

		// 3. 解析请求 IP 的位置（用于模板展示和日志 params 快照）
		const location = geoService.formatLocation(
			await geoService.lookup(params.ip),
		);

		const templateProps = {
			siteTitle,
			siteFooter,
			greeting: `你好，${adminName}！`,
			code,
			expiresInMinutes: params.expiresInMinutes,
			hue,
			ip: params.ip,
			location,
		};

		const html = await render(createElement(ResetPasswordEmail, templateProps));

		const result = await emailDispatchService.dispatch({
			to: [params.to],
			subject: `[${siteTitle}] 密码重置验证码`,
			html,
			smtpConfig,
			siteTitle,
			type: "reset_password",
			params: templateProps,
		});

		return { ...result, code };
	}

	/**
	 * 重新渲染历史邮件的 HTML（管理后台预览用）
	 * @param uuid 邮件日志记录的 UUID
	 * @returns 渲染后的 HTML 字符串
	 */
	async previewEmailLog(uuid: string): Promise<string> {
		const log = await emailLogDao.findById(uuid);
		if (!log) {
			throw new BusinessError("邮件记录不存在", { status: 404 });
		}
		const params = (log.params ?? {}) as Record<string, unknown>;

		// 根据日志类型渲染对应模板
		switch (log.type) {
			case "smtp_test":
				return render(
					createElement(SMTPTestEmail, params as TSMTPTestEmailParams),
				);
			case "login_alert":
				return render(
					createElement(LoginAlertEmail, params as TLoginAlertEmailParams),
				);
			case "reset_password":
				return render(
					createElement(
						ResetPasswordEmail,
						params as TResetPasswordEmailParams,
					),
				);
			default:
				throw new BusinessError(`未知的邮件类型: ${log.type}`, { status: 400 });
		}
	}
}

export const emailSenderService = new EmailSenderService();
