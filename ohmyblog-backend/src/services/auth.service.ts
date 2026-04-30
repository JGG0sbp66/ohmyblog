// src/services/auth.service.ts

import { configDao } from "../daos/config.dao";
import { userDao } from "../daos/user.dao";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";

class AuthService {
	private logger = logger.withTag("AuthService");

	/**
	 * 注册逻辑
	 * @param body 用户注册信息（用户名、邮箱、明文密码）
	 * @returns 创建后的用户记录，包含角色与 uuid
	 */
	async register(body: { username: string; email: string; password: string }) {
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

		// 4. 更新最后登录时间和 IP
		// TODO(batch-2): 在更新前对比 IP geo，触发异地登录提醒邮件
		await userDao.updateLastLogin(user.uuid, ip);

		this.logger.info({ userId: user.uuid }, "用户登录成功");
		return user;
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
	async updateAccount(
		uuid: string,
		data: { username?: string; email?: string; password?: string },
	) {
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
