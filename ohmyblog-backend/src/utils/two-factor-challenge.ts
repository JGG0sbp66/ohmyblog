// src/utils/two-factor-challenge.ts
//
// 两步验证登录的中间态凭证。
//
// 密码校验通过但还没过第二道验证时，用户处于「半登录」状态：不能拿到
// auth_token，但服务端得记住他是谁。这里用进程内 TTLCache 承载这段状态。
//
// 为什么不签一个短期 JWT：
//   1. auth.plugin.ts 的 jwtConfig.schema 是严格 t.Object，加字段会牵连
//      所有既有签发/校验点；再开一个 jwt 实例又要多一份密钥配置；
//   2. 失败次数必须记在服务端才有意义，JWT 自带的无状态特性在这里是缺点；
//   3. 进程重启丢失只会让用户重新输一次密码，代价可以接受 —— 项目其余
//      部分（view-counter、config 缓存）本来就建立在单实例假设上。
//
// 多实例部署时这里要换成 Redis，和 utils/cache.ts 的结论一致。

import { randomBytes } from "node:crypto";
import { TTLCache } from "./cache";

/** challenge 有效期：5 分钟，够用户翻出手机打开验证器 App */
const CHALLENGE_TTL_MS = 5 * 60 * 1000;

/** 承载 challengeId 的 cookie 名 */
export const CHALLENGE_COOKIE_NAME = "two_factor_challenge";

/**
 * challenge 有效期的秒数版本。
 *
 * route 层拿它当 cookie 的 maxAge —— 与内存里的 TTL 同源，避免 cookie 还在、
 * 服务端记录已过期（或反之）这种两头打架的情况。
 */
export const CHALLENGE_TTL_SECONDS = CHALLENGE_TTL_MS / 1000;

/**
 * 单个 challenge 允许的失败次数。
 *
 * TOTP 只有 6 位数字、30s 一换，不限次数等于把两步验证降级成「多试几次的验证码」：
 * 无限重试下猜中当前窗口的期望次数只有 50 万量级。超限即销毁 challenge，
 * 攻击者必须重新提交正确密码才能拿到新的一次机会。
 */
const MAX_ATTEMPTS = 5;

interface Challenge {
	/** 已通过密码校验的用户 */
	userUuid: string;
	/** 已失败次数 */
	attempts: number;
}

// key 是 challengeId，value 是半登录状态
const challengeCache = new TTLCache<string, Challenge>({
	ttlMs: CHALLENGE_TTL_MS,
	maxSize: 256,
});

export interface ChallengeVerifyResult {
	/** 是否还持有有效 challenge（false 表示已过期或已被销毁，需重新登录） */
	alive: boolean;
	/** 还剩几次机会 */
	remaining: number;
}

/**
 * 创建一个 challenge。
 *
 * @param userUuid 已通过密码校验的用户 UUID
 * @returns challengeId，随机 32 字节，下发到 httpOnly cookie
 */
export const createChallenge = (userUuid: string): string => {
	const id = randomBytes(32).toString("hex");
	challengeCache.set(id, { userUuid, attempts: 0 });
	return id;
};

/**
 * 读取 challenge 对应的用户
 * @param id challengeId
 * @returns 用户 UUID，challenge 不存在 / 已过期时返回 null
 */
export const getChallengeUser = (id: string | undefined): string | null => {
	if (!id) return null;
	return challengeCache.get(id)?.userUuid ?? null;
};

/**
 * 记一次失败尝试。达到上限时直接销毁 challenge，用户必须从密码那一步重来。
 *
 * @param id challengeId
 * @returns alive 表示 challenge 是否还在，remaining 是剩余次数
 */
export const recordFailedAttempt = (
	id: string | undefined,
): ChallengeVerifyResult => {
	if (!id) return { alive: false, remaining: 0 };

	const challenge = challengeCache.get(id);
	if (!challenge) return { alive: false, remaining: 0 };

	challenge.attempts += 1;

	if (challenge.attempts >= MAX_ATTEMPTS) {
		challengeCache.delete(id);
		return { alive: false, remaining: 0 };
	}

	// TTLCache 的 value 是引用，改完不必回写；但重新 set 会顺带刷新 TTL，
	// 这里刻意不刷新 —— 失败重试不应该延长 challenge 的寿命
	return { alive: true, remaining: MAX_ATTEMPTS - challenge.attempts };
};

/**
 * 消费掉 challenge（校验成功、或用户主动放弃时调用），确保不能复用
 * @param id challengeId
 */
export const consumeChallenge = (id: string | undefined): void => {
	if (!id) return;
	challengeCache.delete(id);
};
