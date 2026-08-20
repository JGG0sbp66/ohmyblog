// src/utils/reset-password-throttle.ts
//
// 「忘记密码」发信的节流。两道限制，都按**账号**计，不按 IP：
//
//   1. 冷却期：两封邮件之间至少间隔 RESET_PASSWORD_RESEND_COOLDOWN_SEC
//   2. 小时配额：每小时最多 RESET_PASSWORD_HOURLY_QUOTA 封
//
// 为什么不按 IP：真实 IP 只有在 TRUST_PROXY 配置正确时才可信，配错或直接
// 暴露公网时按 IP 计数就形同虚设；而且按 IP 还有反向问题 —— 伪造成站长的
// IP 去触发针对站长的惩罚。按账号计不依赖任何部署配置，始终有效。
//
// 这两道限制保护三样东西：
//   - SMTP 配额（被刷爆有可能被服务商判定滥发直接封号）
//   - 站长的收件箱（不至于被轰炸）
//   - 验证码本身的失败次数上限（换新码会把 attempts 清零，不限制发信频率的话
//     攻击者可以靠反复申请拿到无限的重试机会）
//
// 占用是「检查 + 记账」一步完成的原子操作：发信要花数秒，如果先检查、等发完
// 再记账，并发 N 个请求会在任何一个记账之前全部通过检查，两道限制同时失效
// （邮箱轰炸 + 烧 SMTP 配额），并发交错还会留下两条同时有效的验证码、稀释单码
// 的失败次数上限。所以先占用、发信失败再回滚（begin/rollback 一对）。
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
 * 原子地「检查并占用」一次发信名额。
 *
 * 允许发送时同步完成记账（开始冷却、累加小时配额），调用方随后再去发信；
 * 发信失败必须调 rollbackResetPasswordSend() 归还名额，否则失败也消耗配额。
 * 检查与记账在同一个同步调用里完成，JavaScript 单线程保证并发请求不可能
 * 都赶在记账之前通过检查。
 *
 * @param userUuid 目标账号
 * @returns 允许则返回 null，否则返回被拒原因
 */
export const beginResetPasswordSend = (
	userUuid: string,
): ResetPasswordThrottleReason | null => {
	if (cooldown.get(userUuid)) return "cooldown";

	const window = hourlyCount.get(userUuid);
	if (window && window.count >= RESET_PASSWORD_HOURLY_QUOTA) return "quota";

	// 到这里才真正占用：两道限制都过了，同步写进两份计数
	cooldown.set(userUuid, true);

	if (window) {
		// TTLCache 的 value 是引用，直接改计数即可。
		// 刻意不走 set() —— set 会顺带刷新 TTL，让这一小时的窗口随着每次请求
		// 不断往后延，配额就退化成「窗口内首次发送后再也发不出去」
		window.count += 1;
	} else {
		hourlyCount.set(userUuid, { count: 1 });
	}

	return null;
};

/**
 * 发信失败时归还 beginResetPasswordSend() 占用的名额。
 *
 * 没发出去的邮件不该消耗配额 —— SMTP 没配好时站长自己反复重试也不该被
 * 冷却期拦住。冷却与配额都尝试还原；对应的 TTL 已过期时 TTLCache.get 返回
 * undefined，跳过即可（说明窗口本来就已自然结束，无需还原）。
 */
export const rollbackResetPasswordSend = (userUuid: string): void => {
	cooldown.delete(userUuid);

	const window = hourlyCount.get(userUuid);
	if (window) {
		window.count -= 1;
		if (window.count <= 0) hourlyCount.delete(userUuid);
	}
};
