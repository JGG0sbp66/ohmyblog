import { usersDao } from "../dao/users.dao";
import { BusinessError } from "../plugins/errors";
import { systemLogger } from "../plugins/logger.plugin";

class AuthService {
	private logger = systemLogger.child({ module: "AuthService" });

	/**
	 * 注册逻辑
	 * @param body 用户注册信息（用户名、邮箱、明文密码）
	 * @returns 创建后的用户记录，包含角色与 uuid
	 */
	async register(body: { username: string; email: string; password: string }) {
		// 1. 查重
		const exists = await usersDao.checkExists(body.username, body.email);
		if (exists) {
			throw new BusinessError("用户名或邮箱已被注册", {
				status: 409,
			});
		}

		// 检查是否已有管理员用户
		const hasAdmin = await usersDao.hasAnyAdmin();
		const role = hasAdmin ? "user" : "admin";

		// 2. 密码哈希 (使用 Bun 原生的高性能 Argon2/Bcrypt)
		const hashedPassword = await Bun.password.hash(body.password);

		// 3. 落库
		const newUser = await usersDao.createUser({
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
	 * @returns 登录后的用户实体，调用方可读取 role / uuid 等字段
	 */
	async login(identifier: string, passwordPlain: string) {
		// 1. 查找用户
		const user = await usersDao.findByIdentifier(identifier);
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
			await usersDao.activateUser(user.uuid);
			user.status = "active";
		}

		// 4. 更新最后登录时间
		await usersDao.updateLastLogin(user.uuid);

		this.logger.info({ userId: user.uuid }, "用户登录成功");
		return user;
	}
}

export const authService = new AuthService();
