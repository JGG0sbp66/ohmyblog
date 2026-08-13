// src/services/two-factor.service.ts
//
// 两步验证的业务层。分两条使用路径：
//
//   设置路径（已登录）：startSetup → enable / disable / regenerateRecoveryCodes
//   登录路径（半登录）：由 auth 流程在密码通过后调用 verifyLoginCode
//
// 算法细节全在 utils/totp.ts，这里只管状态流转和可预期失败。

import {
	TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE,
	TWO_FACTOR_EXHAUSTED_MESSAGE,
} from "../../db/constants/two-factor.constants";
import { configDao } from "../daos/config.dao";
import { twoFactorDao } from "../daos/two-factor.dao";
import { userDao } from "../daos/user.dao";
import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import {
	createIntervalLimiter,
	RATE_LIMITED_MESSAGE,
} from "../utils/rate-limit";
import {
	buildTotpUri,
	generateRecoveryCodes,
	generateTotpSecret,
	hashRecoveryCode,
	normalizeRecoveryCode,
	verifyTotpToken,
} from "../utils/totp";
import {
	consumeChallenge,
	getChallengeUser,
	recordFailedAttempt,
} from "../utils/two-factor-challenge";
import { authService } from "./auth.service";

/** 验证器 App 里显示不出站点名时的兜底 issuer */
const DEFAULT_ISSUER = "ohmyblog";

/** 登录第二步的提交间隔：同一账号每秒最多验一次 */
const verifyIntervalLimiter = createIntervalLimiter(1000);

class TwoFactorService {
	private logger = logger.withTag("TwoFactorService");

	/**
	 * 取站点标题作为 TOTP 的 issuer（验证器 App 条目的主标题）。
	 * 站点信息还没配置时退回默认值，不让设置流程被配置缺失卡住。
	 */
	private async resolveIssuer(): Promise<string> {
		try {
			const record = await configDao.findByKey("site_info");
			const value = record?.configValue as { title?: string } | undefined;
			const title = value?.title?.trim();
			return title || DEFAULT_ISSUER;
		} catch (err) {
			this.logger.warn({ err }, "读取站点标题失败，issuer 使用默认值");
			return DEFAULT_ISSUER;
		}
	}

	/**
	 * 设置第一步：生成新密钥并返回二维码内容。
	 *
	 * 此时**不启用**，密钥只是先落库占位，等 enable() 校验通过才真正生效。
	 * 每次调用都会覆盖上一次未完成的密钥，避免用户中途放弃后留下一个
	 * 可用但没人知道的密钥。
	 *
	 * @param userUuid 当前登录用户
	 * @returns base32 密钥（供手动输入）与 otpauth URI（供扫码）
	 */
	async startSetup(userUuid: string) {
		const user = await userDao.findById(userUuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}
		if (user.twoFactorEnabled) {
			throw new BusinessError("两步验证已启用，请先关闭再重新绑定", {
				status: 409,
			});
		}

		const secret = generateTotpSecret();
		await userDao.update(userUuid, { twoFactorSecret: secret });

		const issuer = await this.resolveIssuer();
		const uri = buildTotpUri({ secret, issuer, label: user.username });

		this.logger.info({ userId: userUuid }, "已生成两步验证密钥，等待确认");

		return { secret, uri };
	}

	/**
	 * 设置第二步：校验首个验证码，通过后正式启用并签发恢复码。
	 *
	 * 恢复码明文只在这里返回一次，库里只留 SHA-256 摘要，之后任何接口
	 * 都无法再读到明文 —— 用户没保存就只能重新生成。
	 *
	 * @param userUuid 当前登录用户
	 * @param token 验证器 App 上的验证码
	 * @returns 明文恢复码数组
	 */
	async enable(userUuid: string, token: string) {
		const user = await userDao.findById(userUuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}
		if (user.twoFactorEnabled) {
			throw new BusinessError("两步验证已启用，请先关闭再重新绑定", {
				status: 409,
			});
		}
		if (!user.twoFactorSecret) {
			throw new BusinessError("请先获取两步验证二维码", { status: 400 });
		}

		const usedCounter = verifyTotpToken({
			secret: user.twoFactorSecret,
			token,
			lastUsedCounter: user.twoFactorLastUsedCounter,
		});
		if (usedCounter === null) {
			this.logger.warn({ userId: userUuid }, "启用两步验证时验证码校验失败");
			throw new BusinessError("验证码错误，请检查验证器时间是否准确", {
				status: 400,
			});
		}

		const codes = generateRecoveryCodes();
		await twoFactorDao.replaceAll(userUuid, codes.map(hashRecoveryCode));

		await userDao.update(userUuid, {
			twoFactorEnabled: true,
			twoFactorEnabledAt: new Date(),
			twoFactorLastUsedCounter: usedCounter,
		});

		this.logger.info({ userId: userUuid }, "两步验证已启用");

		return { recoveryCodes: codes };
	}

	/**
	 * 关闭两步验证。需要密码二次确认，并清空全部恢复码。
	 *
	 * 注意：项目的 JWT 没有黑名单，关闭后已签发的 auth_token 仍然有效
	 * 直到自然过期，这与「关闭第二因子」的语义不冲突（会话本来就是已认证的）。
	 *
	 * @param userUuid 当前登录用户
	 * @param password 当前账号密码
	 */
	async disable(userUuid: string, password: string) {
		const user = await userDao.findById(userUuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}
		if (!user.twoFactorEnabled) {
			throw new BusinessError("两步验证尚未启用", { status: 400 });
		}

		const isMatch = await Bun.password.verify(password, user.passwordHash);
		if (!isMatch) {
			this.logger.warn({ userId: userUuid }, "关闭两步验证时密码校验失败");
			throw new BusinessError("密码错误", { status: 401 });
		}

		await twoFactorDao.deleteByUser(userUuid);
		await userDao.update(userUuid, {
			twoFactorEnabled: false,
			twoFactorSecret: null,
			twoFactorEnabledAt: null,
			twoFactorLastUsedCounter: null,
		});

		this.logger.info({ userId: userUuid }, "两步验证已关闭");
	}

	/**
	 * 重新生成恢复码，旧的整批作废。
	 *
	 * 要求提交一次当前验证码：只凭「已登录」就能换掉恢复码的话，会话被
	 * 劫持后攻击者可以给自己留一份长期有效的后门凭证。
	 *
	 * @param userUuid 当前登录用户
	 * @param token 验证器 App 上的验证码
	 * @returns 新的明文恢复码数组
	 */
	async regenerateRecoveryCodes(userUuid: string, token: string) {
		const user = await userDao.findById(userUuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}
		if (!user.twoFactorEnabled || !user.twoFactorSecret) {
			throw new BusinessError("两步验证尚未启用", { status: 400 });
		}

		const usedCounter = verifyTotpToken({
			secret: user.twoFactorSecret,
			token,
			lastUsedCounter: user.twoFactorLastUsedCounter,
		});
		if (usedCounter === null) {
			throw new BusinessError("验证码错误，请检查验证器时间是否准确", {
				status: 400,
			});
		}

		const codes = generateRecoveryCodes();
		await twoFactorDao.replaceAll(userUuid, codes.map(hashRecoveryCode));
		await userDao.update(userUuid, { twoFactorLastUsedCounter: usedCounter });

		this.logger.info({ userId: userUuid }, "恢复码已重新生成");

		return { recoveryCodes: codes };
	}

	/**
	 * 登录第二步：校验验证码或恢复码。
	 *
	 * 按格式分派 —— 纯数字且长度等于 TOTP 位数时当验证码处理，其余一律
	 * 当恢复码。两者的失败都抛同一句提示，不告诉调用方「格式不对」还是
	 * 「码不对」，减少可探测的信息。
	 *
	 * 失败次数限制不在这里，由 utils/two-factor-challenge.ts 按 challenge 计数。
	 *
	 * @param userUuid 已通过密码校验的用户
	 * @param code 用户提交的验证码或恢复码
	 * @returns 用户实体，交给 route 签发 auth_token 并收尾登录
	 */
	async verifyLoginCode(userUuid: string, code: string) {
		const user = await userDao.findById(userUuid);
		if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
			throw new BusinessError("两步验证尚未启用", { status: 400 });
		}

		const trimmed = code.trim();

		// 分支一：验证器验证码
		if (/^\d+$/.test(trimmed.replace(/\s+/g, ""))) {
			const usedCounter = verifyTotpToken({
				secret: user.twoFactorSecret,
				token: trimmed,
				lastUsedCounter: user.twoFactorLastUsedCounter,
			});
			if (usedCounter === null) {
				this.logger.warn({ userId: userUuid }, "登录两步验证失败：验证码错误");
				throw new BusinessError("验证码错误或已失效", { status: 401 });
			}

			// 记下被消费的时间步，同一个码不能再用（RFC 6238 §5.2）
			await userDao.update(userUuid, {
				twoFactorLastUsedCounter: usedCounter,
			});
			return user;
		}

		// 分支二：恢复码
		const normalized = normalizeRecoveryCode(trimmed);
		if (!normalized) {
			throw new BusinessError("验证码错误或已失效", { status: 401 });
		}

		const record = await twoFactorDao.findActiveByHash(
			userUuid,
			hashRecoveryCode(normalized),
		);
		if (!record) {
			this.logger.warn({ userId: userUuid }, "登录两步验证失败：恢复码无效");
			throw new BusinessError("验证码错误或已失效", { status: 401 });
		}

		await twoFactorDao.markAsUsed(record.uuid);

		const remaining = await twoFactorDao.countActive(userUuid);
		this.logger.info(
			{ userId: userUuid, remaining },
			"用户使用恢复码完成两步验证",
		);

		return user;
	}

	/**
	 * 查询当前状态，供设置页展示
	 * @param userUuid 当前登录用户
	 */
	async getStatus(userUuid: string) {
		const user = await userDao.findById(userUuid);
		if (!user) {
			throw new BusinessError("用户账户不存在", { status: 404 });
		}

		return {
			enabled: user.twoFactorEnabled,
			enabledAt: user.twoFactorEnabledAt,
			recoveryCodesRemaining: user.twoFactorEnabled
				? await twoFactorDao.countActive(userUuid)
				: 0,
		};
	}

	/**
	 * 登录第二步的完整流程：校验 challenge → 验证码/恢复码 → 消费 → 登录收尾。
	 *
	 * 把原来散落在 route 层的 challenge 管理、失败计数、消费、IP 记录全部收拢到这里，
	 * route 只需要拿返回值设 cookie 和返 JSON。
	 *
	 * 抛出的 BusinessError 通过 message 区分（两个文案都在 constants 里同源）：
	 *   - TWO_FACTOR_EXHAUSTED_MESSAGE / TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE
	 *     → challenge 已作废，route 需清除 cookie
	 *   - 其他（如"验证码错误或已失效"） → 保留 cookie，用户还有剩余次数
	 *
	 * @param challengeId httpOnly cookie 里的 challenge 值
	 * @param code 用户提交的验证码或恢复码
	 * @param ip 客户端 IP，登录收尾时记录
	 * @returns 用户信息，供 route 层签发 auth_token
	 */
	async verifyChallenge(
		challengeId: string | undefined,
		code: string,
		ip: string,
	) {
		const userUuid = getChallengeUser(challengeId);

		if (!userUuid) {
			throw new BusinessError(TWO_FACTOR_CHALLENGE_EXPIRED_MESSAGE, {
				status: 401,
			});
		}

		// 限流按**账号**计而不按 challenge：challenge 可以靠重新登录无限申请，
		// 计在它上面的任何限制都能被刷掉。也不按 IP —— 走到这一步说明密码已经
		// 对了，此时限制正主自己的验证频率不会被拿去打击别人。
		//
		// 只压间隔、不设配额，所以不存在「被锁在门外」：等一秒就能再试。
		// 人手输 6 位数字本来要好几秒，正常用户碰不到这条线
		if (!verifyIntervalLimiter.consume(userUuid)) {
			this.logger.warn({ userId: userUuid }, "两步验证提交过于频繁");
			throw new BusinessError(RATE_LIMITED_MESSAGE, { status: 429 });
		}

		// try 只圈住「码对不对」这一件事。
		// 消费 challenge 和登录收尾放到外面：它们失败属于服务端故障，
		// 圈进来会被 catch 当成一次验证失败，让输对码的用户看到"次数过多"。
		let user: Awaited<ReturnType<typeof this.verifyLoginCode>>;
		try {
			user = await this.verifyLoginCode(userUuid, code);
		} catch (err) {
			// 只有「凭证不对」才消耗次数配额。其余错误（如两步验证未启用的 400）
			// 原样上抛，否则会被计数、攒满后还被改写成 401，掩盖真实原因。
			const isCredentialError =
				err instanceof BusinessError && err.status === 401;
			if (!isCredentialError) throw err;

			const { alive } = recordFailedAttempt(challengeId);
			if (!alive) {
				throw new BusinessError(TWO_FACTOR_EXHAUSTED_MESSAGE, {
					status: 401,
				});
			}

			// challenge 还活着，用户还有剩余次数
			throw err;
		}

		// 验证通过：消费 challenge，确保不能签出第二个 token
		consumeChallenge(challengeId);

		// 登录收尾：记录时间/IP + 异地告警
		await authService.recordSuccessfulLogin(user, ip);

		return { uuid: user.uuid, username: user.username, role: user.role };
	}
}

export const twoFactorService = new TwoFactorService();
