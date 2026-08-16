// src/services/email/email-config.service.ts
import { configDao } from "../../daos/config.dao";
import { userDao } from "../../daos/user.dao";
import type {
	TAppearanceConfigUpsertDTO,
	TSiteInfoConfigUpsertDTO,
	TSMTPConfigUpsertDTO,
} from "../../dtos/config.dto";
import { BusinessError } from "../../plugins/errors";
import type { SiteConfig } from "./types";

class EmailConfigService {
	/**
	 * 读取并校验数据库中的 SMTP 配置
	 * @returns SMTP 配置记录
	 */
	async getSmtpConfig(): Promise<TSMTPConfigUpsertDTO["configValue"]> {
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
		// 配置 DTO 允许空串入库（否则空着保存「关闭」状态会 422），
		// 这里拦下半配置状态，不能放给 nodemailer
		if (!config.host || !config.username || !config.password) {
			throw new BusinessError("SMTP 配置不完整，请先在设置中填写邮件服务信息", {
				status: 400,
			});
		}
		return config;
	}

	/**
	 * 邮件服务当前是否可用（已配置且已启用）。
	 *
	 * 与 getSmtpConfig 的区别是不抛错，供需要「先问问能不能发」的调用方使用，
	 * 例如忘记密码页要据此决定是显示邮箱表单还是显示命令行恢复指引。
	 *
	 * @returns 可发信返回 true
	 */
	async isEmailUsable(): Promise<boolean> {
		try {
			const record = await configDao.findByKey("smtp");
			const value = record?.configValue as
				| TSMTPConfigUpsertDTO["configValue"]
				| undefined;
			// 与 getSmtpConfig 的完整性判断保持一致：enabled 但必填字段为空同样视为不可用
			return Boolean(
				value?.enabled && value.host && value.username && value.password,
			);
		} catch {
			return false;
		}
	}

	/**
	 * 读取外观配置（hue），供模板使用
	 * @returns 外观配置记录
	 */
	async getAppearanceConfig(): Promise<{ hue: number }> {
		const record = await configDao.findByKey("appearance");
		const raw = record?.configValue as
			| TAppearanceConfigUpsertDTO["configValue"]
			| null;
		return { hue: raw?.hue ?? 250 };
	}

	/**
	 * 读取站点信息（标题、页脚），供模板使用
	 * @returns 站点配置记录
	 */
	async getSiteConfig(): Promise<SiteConfig> {
		const record = await configDao.findByKey("site_info");
		const raw = record?.configValue as
			| TSiteInfoConfigUpsertDTO["configValue"]
			| null;
		return {
			title: raw?.title ?? "ohmyblog",
			footer: raw?.footer ?? "",
		};
	}

	/**
	 * 获取管理员名称
	 * @returns 管理员名称
	 */
	async getAdminName(): Promise<string> {
		const personalRecord = await configDao.findByKey("personal_info");
		return (
			(personalRecord?.configValue as { username?: string } | null)?.username ??
			"Admin"
		);
	}

	/**
	 * 获取管理员邮箱（用于系统通知）
	 * @returns 管理员邮箱，若未找到返回 null
	 */
	async getAdminEmailAddress(): Promise<string | null> {
		const admin = await userDao.findAdmin();
		return admin?.email ?? null;
	}

	/**
	 * 获取指定用户的最后登录 IP
	 * @param uuid 用户唯一标识
	 * @returns 最后登录 IP，若不存在则返回 null
	 */
	async getUserLastLoginIp(uuid: string): Promise<string | null> {
		const user = await userDao.findById(uuid);
		return user?.lastLoginIp ?? null;
	}
}

export const emailConfigService = new EmailConfigService();
