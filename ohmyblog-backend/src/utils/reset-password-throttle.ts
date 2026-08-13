// src/utils/reset-password-throttle.ts
//
// 「忘记密码」发信的节流。两道限制，都按**账号**计，不按 IP：
//
//   1. 冷却期：两封邮件之间至少间隔 RESET_PASSWORD_RESEND_COOLDOWN_SEC
//   2. 小时配额：每小时最多 RESET_PASSWORD_HOURLY_QUOTA 封
//
// 为什么不按 IP：getClientIp 目前无条件信任 X-Forwarded-For，攻击者随手伪造
// 一个头就能换一个「IP」，按 IP 计数等于没计。而且按 IP 还会有反向问题 ——
// 伪造成站长的 IP 去触发针对站长的惩罚。按账号计不受这两点影响。
//
// 这两道限制保护三样东西：
//   - SMTP 配额（被刷爆有可能被服务商判定滥发直接封号）
//   - 站长的收件箱（不至于被轰炸）
//   - 验证码本身的失败次数上限（换新码会把 attempts 清零，不限制发信频率的话
//     攻击者可以靠反复申请拿到无限的重试机会）
//
// 与 utils/cache.ts、utils/two-factor-challenge.ts 一样是进程内状态：
// 多实例部署要换成 Redis。进程重启会清空计数，代价是攻击者能多发几封邮件，
// 可以接受。

import {
	RESET_PASSWORD_HOURLY_QUOTA,
	RESET_PASSWORD_RESEND_COOLDOWN_SEC,
} from "../../db/constants/email-verification.constants";
import { TTLCache } from "./cache";

const HOUR_MS = 60 * 60 * 1000;

/** key 是 userUuid，值无意义，存在即代表还在冷却期内（靠 TTL 自动消失） */
const cooldown = new TTLCache<string, true>({
	ttlMs: RESET_PASSWORD_RESEND_COOLDOWN_SEC * 1000,
	maxSize: 256,
});

/** key 是 userUuid，值是当前这一小时窗口内的已发送数 */
const hourlyCount = new TTLCache<string, { count: number }>({
	ttlMs: HOUR_MS,
	maxSize: 256,
});

/** 被拒原因，仅用于服务端日志 —— 对外响应必须保持一致，不能泄漏给调用方 */
export type ResetPasswordThrottleReason = "cooldown" | "quota";

/**
 * 检查是否允许为该账号发送重置邮件。
 *
 * 只做检查不记账，允许发送时由调用方在**发信成功后**调用
 * recordResetPasswordSend()，避免发信失败也白白消耗配额。
 *
 * @param userUuid 目标账号
 * @returns 允许则返回 null，否则返回被拒原因
 */
export const checkResetPasswordThrottle = (
	userUuid: string,
): ResetPasswordThrottleReason | null => {
	if (cooldown.get(userUuid)) return "cooldown";

	const window = hourlyCount.get(userUuid);
	if (window && window.count >= RESET_PASSWORD_HOURLY_QUOTA) return "quota";

	return null;
};

/**
 * 记一次成功发送：开始冷却，并累加小时计数。
 *
 * @param userUuid 目标账号
 */
export const recordResetPasswordSend = (userUuid: string): void => {
	cooldown.set(userUuid, true);

	const window = hourlyCount.get(userUuid);
	if (window) {
		// TTLCache 的 value 是引用，直接改计数即可。
		// 刻意不走 set() —— set 会顺带刷新 TTL，让这一小时的窗口随着每次请求
		// 不断往后延，配额就退化成「窗口内首次发送后再也发不出去」
		window.count += 1;
	} else {
		hourlyCount.set(userUuid, { count: 1 });
	}
};
