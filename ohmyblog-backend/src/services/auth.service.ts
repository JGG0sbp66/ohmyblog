// src/services/auth.service.ts

import {
	RESET_PASSWORD_CODE_TTL_MIN,
	RESET_PASSWORD_MAX_ATTEMPTS,
} from "../../db/constants/email-verification.constants";
import { configDao } from "../daos/config.dao";
import { emailVerificationDao } from "../daos/email-verification.dao";
import { userDao } from "../daos/user.dao";
import type { TRegisterDTO, TUpdateAccountDTO } from "../dtos/auth.dto";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import {
	createFixedWindowLimiter,
	RATE_LIMITED_MESSAGE,
} from "../utils/rate-limit";
import {
	beginResetPasswordSend,
	rollbackResetPasswordSend,
} from "../utils/reset-password-throttle";
import {
	CHALLENGE_TTL_SECONDS,
	createChallenge,
} from "../utils/two-factor-challenge";
import { captchaService } from "./captcha/captcha.service";
import {
	emailSenderService,
	generateResetPasswordCode,
} from "./email/email-sender.service";

/**
 * 登录限流：同一 IP 每分钟最多 10 次。
 *
 * 10 次对人类足够宽松（含输错重试），对爆破则把速率从「不限」压到每小时
 * 600 次。注意真实 IP 依赖 TRUST_PROXY 配置正确，见 utils/getClientIp.ts；
 * 换 IP 的分布式攻击绕不掉这一层，那需要 CAPTCHA，见 CLAUDE.md 待办
 */
const loginLimiter = createFixedWindowLimiter({
	windowMs: 60_000,
	max: 10,
});

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
		// userDao.createUser 在 role === "admin" 时会自动把 hasAnyAdmin 缓存置 true，
		// 后续 healthRoute / ensureAdminIfExists 不会再触达数据库
		const newUser = await userDao.createUser({
			username: body.username,
			email: body.email,
			passwordHash: hashedPassword,
			role: role,
		});

		this.logger.info(
			{ userId: newUser.uuid, role },
			role === "admin" ? "初始化管理员账号注册成功" : "用户注册成功",
		);
		return newUser;
	}

	/**
	 * 登录逻辑
	 *
	 * 返回区分两种情况的结果：
	 *   - requiresTwoFactor: true  → 密码通过但需要第二步验证，附带 challenge cookie 数据
	 *   - requiresTwoFactor: false → 直接登录成功，附带用户信息供签发 token
	 *
	 * @param identifier 用户名或邮箱
	 * @param passwordPlain 明文密码
	 * @param ip 客户端 IP，用于异地登录检测和登录历史记录
	 * @param captchaToken 人机验证的一次性凭证，未启用验证码时可不传
	 */
	async login(
		identifier: string,
		passwordPlain: string,
		ip: string,
		captchaToken?: string,
	) {
		// 0. 限流。按 IP 而不按账号：用户名在站点上是公开的，按账号计等于给
		//    任何人一个把站长锁在门外的开关。
		//    在密码校验之前拦下来，顺带也挡住了拿 Argon2 的计算开销打 CPU
		if (!loginLimiter.consume(ip)) {
			this.logger.warn({ ip, identifier }, "登录请求被限流");
			throw new BusinessError(RATE_LIMITED_MESSAGE, { status: 429 });
		}

		// 0.5 人机验证。位置是夹出来的，两边都不能挪：
		//
		//     在限流**之后** —— 校验要向服务商发一次外网请求，放在限流前面
		//     等于给了任何人一个「刷我的接口就能让我无限次去打 Cloudflare」
		//     的放大器。
		//
		//     在查账号**之前** —— 反过来的话，「验证码错」和「账号不存在」
		//     会走出不同的响应路径，登录接口就成了账号枚举器。
		//
		// 未启用验证码、或登录这个入口没勾上时，这一行什么都不做
		await captchaService.ensureVerified("login", captchaToken, ip);

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

		// 4. 启用了两步验证：密码只是第一道，创建 challenge 等第二步
		if (user.twoFactorEnabled) {
			this.logger.info({ userId: user.uuid }, "密码校验通过，等待两步验证");
			return {
				requiresTwoFactor: true as const,
				challenge: {
					challengeId: createChallenge(user.uuid),
					expiresIn: CHALLENGE_TTL_SECONDS,
				},
			};
		}

		// 5. 没开两步验证：直接收尾
		await this.recordSuccessfulLogin(user, ip);

		return {
			requiresTwoFactor: false as const,
			user: { uuid: user.uuid, username: user.username, role: user.role },
		};
	}

	/**
	 * 收尾一次成功登录：更新登录时间与 IP，并按需触发异地登录告警。
	 *
	 * 抽成独立方法是因为有两个调用点 —— 未启用两步验证时由 login() 顺势调用，
	 * 启用时则要等第二道验证通过后才算真正登录（见 two-factor.route.ts）。
	 *
	 * @param user 登录用户实体，必须是**更新前**的记录，lastLoginIp 用于异地比对
	 * @param ip 本次登录 IP
	 */
	async recordSuccessfulLogin(
		user: {
			uuid: string;
			email: string;
			lastLoginIp: string | null;
		},
		ip: string,
	) {
		// 先抓上次登录的 IP（在更新前），后面用来做异地检测
		const previousIp = user.lastLoginIp;

		// 更新最后登录时间和 IP
		await userDao.updateLastLogin(user.uuid, ip);

		this.logger.info({ userId: user.uuid }, "用户登录成功");

		// 异步触发异地登录检测（fire-and-forget）
		if (previousIp) {
			emailSenderService
				.maybeSendLoginAlert({
					to: user.email,
					currentIp: ip,
					previousIp,
					loginAt: new Date(),
				})
				.catch((err: unknown) =>
					this.logger.error({ err }, "异地登录检测任务异常"),
				);
		}
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
	 * @param captchaToken 人机验证的一次性凭证，未启用验证码时可不传
	 */
	async forgotPassword(email: string, ip: string, captchaToken?: string) {
		// 人机验证放在查邮箱之前。这个接口的每条失败路径对外都必须是同一句话，
		// 而验证码的结论与邮箱是否注册无关，所以它抛出的错不会破坏防枚举 ——
		// 反过来放在后面才会：那样「邮箱存在但验证码错」和「邮箱不存在」的
		// 响应就不一样了
		await captchaService.ensureVerified("forgotPassword", captchaToken, ip);

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

		// 1. 节流：原子地「检查并占用」一次发信名额，冷却期内或超出小时配额时
		//    静默返回。占用必须发生在发信之前（同步完成），否则并发请求会全部
		//    通过检查、把两道限制一起冲垮。
		//    静默是关键 —— 一旦对外报「请稍后再试」，攻击者就能凭响应差异
		//    判断这个邮箱是否注册过，防枚举的设计就破了
		const throttled = beginResetPasswordSend(user.uuid);
		if (throttled) {
			this.logger.warn(
				{ userId: user.uuid, reason: throttled },
				"重置密码请求被节流",
			);
			return;
		}

		// 2. 已有未过期的码就重发它，不生成新码。
		//    换新码会把已累计的 attempts 清零，那样 RESET_PASSWORD_MAX_ATTEMPTS
		//    只要靠反复申请就能绕过
		const existing = await emailVerificationDao.findActive(
			user.uuid,
			"reset_password",
		);

		try {
			let codeToSend = existing?.code;
			// 邮件里写的有效期：新码是完整 TTL；重发的是存量旧码，必须按它的
			// **剩余**时长写 —— 满额写 5 分钟，用户拿到只剩 1 分钟的码就被误导了
			let validityMinutes = RESET_PASSWORD_CODE_TTL_MIN;
			if (!codeToSend) {
				// 新码「先生成落库、再发信」，顺序不能反：先发后存的话，落库
				// 失败（磁盘满 / 锁超时）时邮件已经送达，站长邮箱里躺着一个
				// 永远无法通过校验的码，且库里无迹可查；先存后发，失败只可能
				// 是「发不出去」—— 码安稳在库里，下一轮申请照样重发它
				codeToSend = generateResetPasswordCode();
				const expiresAt = new Date(
					Date.now() + RESET_PASSWORD_CODE_TTL_MIN * 60 * 1000,
				);
				// 先作废旧码 → 再写新码，避免同时存在多个有效验证码
				await emailVerificationDao.invalidateByUser(
					user.uuid,
					"reset_password",
				);
				await emailVerificationDao.create({
					userUuid: user.uuid,
					type: "reset_password",
					code: codeToSend,
					expiresAt,
					ip,
				});
			} else {
				const activeVerification = existing;
				if (!activeVerification) {
					throw new Error("有效验证码状态不一致");
				}
				const remainingMs = activeVerification.expiresAt.getTime() - Date.now();
				validityMinutes = Math.max(1, Math.ceil(remainingMs / 60_000));
				// 审计 ip 指向最近一次触发申请的来源，而不是永远停在第一次
				await emailVerificationDao.updateIp(activeVerification.uuid, ip);
			}

			await emailSenderService.sendResetPasswordEmail({
				to: user.email,
				expiresInMinutes: validityMinutes,
				ip,
				code: codeToSend,
			});
		} catch (err) {
			// 新码已落库但信没发出去：作废掉，别让一个谁也没收到过的码占住
			// 「重发已有码」的逻辑。清理自身失败不能掩盖原始错误
			if (!existing) {
				await emailVerificationDao
					.invalidateByUser(user.uuid, "reset_password")
					.catch(() => {});
			}
			// 发信失败（最常见的是根本没配 SMTP）必须在这里吞掉。
			// 让它冒到 route 层的话，「邮箱不存在」返回 200、「邮箱存在但没配
			// SMTP」返回 400，两者响应不同 —— 接口就变成了一个邮箱枚举器，
			// 而没配 SMTP 恰好是新装站点的默认状态。
			// 名额在发信前就占下了，这里必须归还，否则失败也白白消耗配额
			rollbackResetPasswordSend(user.uuid);
			// 站长排查看 data/logs/error.log 与 email_log 表
			this.logger.error(
				{ err, userId: user.uuid },
				"重置密码邮件发送失败，已对外静默",
			);
			return;
		}

		// 3. 记账已在 beginResetPasswordSend 里同步完成（见上方注释）

		this.logger.info(
			{ userId: user.uuid, resent: Boolean(existing) },
			"重置密码验证码已发送",
		);
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
			// 码不对：把这次失败记在该邮箱当前那个有效码上。
			//
			// 计数必须挂在「被攻击的那个码」而不是「提交上来的错码」上 ——
			// 错码在库里根本没有对应记录，无处可记，那样就等于不限次数。
			// 邮箱不存在时什么都不做，同样不能因为「有没有码可记」而产生
			// 可观测的差异
			await this.penalizeResetPasswordAttempt(email);
			throw new BusinessError("验证码无效或已过期", { status: 400 });
		}

		const user = await userDao.findById(record.userUuid);
		if (!user || user.email !== email) {
			this.logger.warn(
				{ recordUserId: record.userUuid, submittedEmail: email },
				"重置密码时 code 与邮箱不匹配",
			);
			// 猜中了别人的码但邮箱对不上，也算一次针对该邮箱的失败尝试
			await this.penalizeResetPasswordAttempt(email);
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
	 * 记一次重置密码的失败尝试：给该邮箱当前有效的验证码累加失败次数，
	 * 达到 RESET_PASSWORD_MAX_ATTEMPTS 就直接作废它。
	 *
	 * 作废之后用户必须重新申请，而重新申请受冷却期和小时配额约束
	 * （见 utils/reset-password-throttle.ts）—— 两者合起来才把 6 位数字
	 * 从「几小时能撞开」压到不可行。
	 *
	 * 全程不抛错、不改变调用方的响应：任何失败路径对外都必须是同一句
	 * 「验证码无效或已过期」，否则又成了可探测的信息。
	 *
	 * @param email 请求方提交的邮箱
	 */
	private async penalizeResetPasswordAttempt(email: string) {
		try {
			const user = await userDao.findByIdentifier(email);
			if (!user) return;

			const active = await emailVerificationDao.findActive(
				user.uuid,
				"reset_password",
			);
			if (!active) return;

			const attempts = await emailVerificationDao.incrementAttempts(
				active.uuid,
			);

			if (attempts >= RESET_PASSWORD_MAX_ATTEMPTS) {
				await emailVerificationDao.markAsUsed(active.uuid);
				this.logger.warn(
					{ userId: user.uuid, attempts },
					"重置密码验证码失败次数用尽，已作废该验证码",
				);
			}
		} catch (err) {
			// 记账失败不能影响对外响应，否则失败路径之间会产生可观测差异
			this.logger.error({ err }, "累加重置密码失败次数时异常");
		}
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
			// 与 /auth/me 的演示分支保持同一个返回结构，
			// 否则 Eden 推给前端的类型会变成联合类型，前端读 isDemo 就要到处收窄
			isDemo: false,
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

		// 如果没有需要更新的内容，直接返回当前记录
		if (Object.keys(updateData).length === 0) {
			const currentUser = await userDao.findById(uuid);
			if (!currentUser) {
				throw new BusinessError("用户不存在", { status: 404 });
			}
			return currentUser;
		}

		const updatedUser = await userDao.update(uuid, updateData);
		if (!updatedUser) {
			throw new BusinessError("用户不存在", { status: 404 });
		}

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
