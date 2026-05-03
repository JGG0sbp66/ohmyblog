// src/services/auth.service.ts

import { configDao } from "../daos/config.dao";
import { emailVerificationDao } from "../daos/email-verification.dao";
import { userDao } from "../daos/user.dao";
import type { TRegisterDTO, TUpdateAccountDTO } from "../dtos/auth.dto";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import { emailSenderService } from "./email/email-sender.service";

/** 重置密码验证码有效期（分钟） */
const RESET_PASSWORD_CODE_TTL_MIN = 15;

class AuthService {
	private logger = logger.withTag("AuthService");

	/**
	 * 注册逻辑
	 * @param body 用户注册信息（用户名、邮箱、明文密码）
	 * @returns 创建后的用户记录，包含角色与 uuid
	 */
	async register(body: TRegisterDTO) {
		// 1. 查重
		const exists = await userDao.checkExists(body.username, body.email);
		if (exists) {
			throw new BusinessError("用户名或邮箱已被注册", {
				status: 409,
			});
		}

		// 检查是否已有管理员用户
		const hasAdmin = await userDao.hasAnyAdmin();
		const role = hasAdmin ? "user" : "admin";

		// 2. 密码哈希 (使用 Bun 原生的高性能 Argon2/Bcrypt)
		const hashedPassword = await Bun.password.hash(body.password);

		// 3. 落库
		const newUser = await userDao.createUser({
			username: body.username,
			email: body.email,
			passwordHash: hashedPassword,
			role: role,
		});

		// 一旦创建管理员，更新缓存，避免后续再查库
		if (role === "admin") {
			const { markHasAdmin } = await import("../plugins/adminGuard");
			markHasAdmin();
		}

		this.logger.info(
			{ userId: newUser.uuid, role },
			role === "admin" ? "初始化管理员账号注册成功" : "用户注册成功",
		);
		return newUser;
	}

	/**
	 * 登录逻辑
	 * @param identifier 用户名或邮箱
	 * @param passwordPlain 明文密码
	 * @param ip 客户端 IP，用于异地登录检测和登录历史记录
	 * @returns 登录后的用户实体，调用方可读取 role / uuid 等字段
	 */
	async login(identifier: string, passwordPlain: string, ip: string) {
		// 1. 查找用户
		const user = await userDao.findByIdentifier(identifier);
		if (!user) {
			throw new BusinessError("账号或密码错误", { status: 401 });
		}

		// 2. 校验密码
		const isMatch = await Bun.password.verify(passwordPlain, user.passwordHash);
		if (!isMatch) {
			this.logger.warn({ identifier }, "用户登录失败：密码错误");
			throw new BusinessError("账号或密码错误", { status: 401 });
		}

		// 3. 检查状态
		if (user.status === "banned") {
			this.logger.warn({ user: user.username }, "尝试登录被封禁的账户");
			throw new BusinessError("账户已被封禁", { status: 403 });
		}

		if (user.status === "inactive") {
			this.logger.info({ user: user.username }, "用户首次登录，自动激活账户");
			await userDao.activateUser(user.uuid);
			user.status = "active";
		}

		// 4. 先抓上次登录的 IP（在更新前），后面用来做异地检测
		const previousIp = user.lastLoginIp;

		// 5. 更新最后登录时间和 IP
		await userDao.updateLastLogin(user.uuid, ip);

		this.logger.info({ userId: user.uuid }, "用户登录成功");

		// 6. 异步触发异地登录检测（fire-and-forget）
		if (previousIp) {
			emailSenderService
				.maybeSendLoginAlert({
					to: user.email,
					currentIp: ip,
					previousIp,
					loginAt: new Date(),
				})
				.catch((err: unknown) => this.logger.error({ err }, "异地登录检测任务异常"));
		}

		return user;
	}

	/**
	 * 忘记密码第一步：根据邮箱发送验证码
	 *
	 * 安全设计：无论邮箱是否存在，都返回同样的成功提示，以防止
	 * 攻击者通过接口枚举出有效邮箱。记得验证码只能发出去一次，带有
	 * 15 分钟过期时间。
	 *
	 * @param email 用户邮箱
	 * @param ip 请求来源 IP，写入验证码记录供审计
	 */
	async forgotPassword(email: string, ip: string) {
		const user = await userDao.findByIdentifier(email);
		// 邮箱不存在时静默返回，不暴露任何信息
		if (!user) {
			this.logger.warn({ email }, "重置密码请求指向不存在的邮箱");
			return;
		}
		if (user.status === "banned") {
			this.logger.warn({ userId: user.uuid }, "被封禁账户尝试重置密码");
			return;
		}

		// 1. 发送邮件并在内部生成加密安全验证码
		const { code } = await emailSenderService.sendResetPasswordEmail({
			to: user.email,
			expiresInMinutes: RESET_PASSWORD_CODE_TTL_MIN,
			ip,
		});

		// 2. 将生成的验证码及过期信息存入数据库
		const expiresAt = new Date(
			Date.now() + RESET_PASSWORD_CODE_TTL_MIN * 60 * 1000,
		);

		// 先作废旧码 → 再写新码，避免同时存在多个有效验证码
		await emailVerificationDao.invalidateByUser(user.uuid, "reset_password");
		await emailVerificationDao.create({
			userUuid: user.uuid,
			type: "reset_password",
			code,
			expiresAt,
			ip,
		});

		this.logger.info({ userId: user.uuid }, "重置密码验证码已发送");
	}

	/**
	 * 忘记密码第二步：验证 code 并重置密码
	 *
	 * 为了防止枚举、重放：
	 * - code 严格与 email 绑定校验，不允许 A 账号的 code 重置 B 账号
	 * - 验证成功后立即 markAsUsed，同一 code 不能用两次
	 */
	async resetPassword(email: string, code: string, newPassword: string) {
		const record = await emailVerificationDao.findActiveByCode(
			code,
			"reset_password",
		);
		if (!record) {
			throw new BusinessError("验证码无效或已过期", { status: 400 });
		}

		const user = await userDao.findById(record.userUuid);
		if (!user || user.email !== email) {
			this.logger.warn(
				{ recordUserId: record.userUuid, submittedEmail: email },
				"重置密码时 code 与邮箱不匹配",
			);
			throw new BusinessError("验证码无效或已过期", { status: 400 });
		}
		if (user.status === "banned") {
			throw new BusinessError("账户已被封禁", { status: 403 });
		}

		const hashedPassword = await Bun.password.hash(newPassword);
		await userDao.update(user.uuid, { passwordHash: hashedPassword });
		await emailVerificationDao.markAsUsed(record.uuid);

		this.logger.info({ userId: user.uuid }, "密码重置成功");
	}

	/**
	 * 获取当前用户信息 (及状态校验)
	 * @param uuid 用户唯一标识
	 * @returns 精简后的用户信息
	 */
	async getMe(uuid: string) {
		const user = await userDao.findById(uuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}

		if (user.status === "banned") {
			throw new BusinessError("账户已被封禁", { status: 403 });
		}

		return {
			uuid: user.uuid,
			username: user.username,
			email: user.email,
			role: user.role,
		};
	}

	/**
	 * 更新账号信息 (单用户系统简化逻辑)
	 * @param uuid 用户唯一标识
	 * @param data 待更新的账号信息
	 */
	async updateAccount(uuid: string, data: TUpdateAccountDTO) {
		const updateData: {
			username?: string;
			email?: string;
			passwordHash?: string;
		} = {};

		if (data.username) updateData.username = data.username;
		if (data.email) updateData.email = data.email;
		if (data.password) {
			updateData.passwordHash = await Bun.password.hash(data.password);
		}

		// 如果没有需要更新的内容，直接返回
		if (Object.keys(updateData).length === 0) {
			return await userDao.findById(uuid);
		}

		const updatedUser = await userDao.update(uuid, updateData);

		// 5. 同步更新 config 中的 username (针对单用户系统的显示名称同步)
		if (data.username) {
			try {
				const personalInfo = await configDao.findByKey("personal_info");
				if (personalInfo?.configValue) {
					const newValue = {
						...(personalInfo.configValue as object),
						username: data.username,
					};
					await configDao.updateByKey("personal_info", {
						configValue: newValue,
					});
					this.logger.info("已同步更新个人资料中的显示名称");
				}
			} catch (err) {
				this.logger.error({ err }, "同步更新个人资料显示名称失败");
			}
		}

		this.logger.info({ userId: uuid }, "账号信息更新成功");
		return updatedUser;
	}
}

export const authService = new AuthService();
