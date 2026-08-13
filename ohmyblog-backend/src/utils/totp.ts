// src/utils/totp.ts
//
// 两步验证的算法层：TOTP 的生成/校验交给 otpauth（RFC 6238），
// 这里只做三件事 —— 收敛参数（位数/步长/窗口来自共享常量）、
// 把库的返回值翻译成业务语义、以及恢复码的生成与摘要。
//
// 上层 service 不直接 import otpauth，换库时只需要改这一个文件。

import { createHash, randomInt } from "node:crypto";
import { Secret, TOTP } from "otpauth";
import {
	RECOVERY_CODE_ALPHABET,
	RECOVERY_CODE_COUNT,
	RECOVERY_CODE_LENGTH,
	TOTP_DIGITS,
	TOTP_PERIOD,
	TOTP_WINDOW,
} from "../../db/constants/two-factor.constants";

/**
 * 生成一个新的 TOTP 密钥。
 *
 * 20 字节（160 bit）是 RFC 4226 §4 R6 推荐的长度，也是各家验证器 App
 * 的事实标准；base32 编码后正好 32 个字符，适合手动输入。
 *
 * @returns base32 编码的密钥字符串
 */
export const generateTotpSecret = (): string => new Secret({ size: 20 }).base32;

/**
 * 构造 otpauth:// URI，前端把它渲染成二维码给验证器 App 扫。
 *
 * @param params.secret base32 密钥
 * @param params.issuer 签发方，显示在 App 的条目标题上（用站点名）
 * @param params.label 账号标识，显示在 App 的条目副标题上（用用户名或邮箱）
 * @returns Google Authenticator Key URI
 */
export const buildTotpUri = (params: {
	secret: string;
	issuer: string;
	label: string;
}): string => {
	const totp = new TOTP({
		issuer: params.issuer,
		label: params.label,
		secret: Secret.fromBase32(params.secret),
		algorithm: "SHA1",
		digits: TOTP_DIGITS,
		period: TOTP_PERIOD,
	});

	return totp.toString();
};

/**
 * 计算某个时刻所处的 TOTP 时间步计数器。
 * 用于把「校验通过」落库成 twoFactorLastUsedCounter，实现验证码一次性使用。
 *
 * @param timestamp 毫秒时间戳，默认当前时间
 */
export const currentTotpCounter = (timestamp: number = Date.now()): number =>
	TOTP.counter({ period: TOTP_PERIOD, timestamp });

/**
 * 校验一个 TOTP 验证码。
 *
 * 允许 ±TOTP_WINDOW 个时间步的偏移，用来兜住客户端与服务端的时钟差；
 * 因此校验成功时实际命中的时间步不一定是当前时间步，需要把 delta 加回去
 * 才能得到真正被消费掉的那个 counter。
 *
 * @param params.secret base32 密钥
 * @param params.token 用户提交的验证码
 * @param params.lastUsedCounter 上一次成功校验的时间步，null 表示从未成功过。
 *   命中的时间步不大于它时判定为重放，直接失败（RFC 6238 §5.2）。
 * @returns 校验通过则返回被消费的时间步，否则 null
 */
export const verifyTotpToken = (params: {
	secret: string;
	token: string;
	lastUsedCounter?: number | null;
}): number | null => {
	// 用户可能输入空格（部分 App 显示成 "123 456"），先规整
	const token = params.token.replace(/\s+/g, "");
	if (token.length !== TOTP_DIGITS) return null;

	const timestamp = Date.now();
	const delta = TOTP.validate({
		token,
		secret: Secret.fromBase32(params.secret),
		algorithm: "SHA1",
		digits: TOTP_DIGITS,
		period: TOTP_PERIOD,
		timestamp,
		window: TOTP_WINDOW,
	});

	// null 表示搜索窗口内没有任何时间步能生成这个码
	if (delta === null) return null;

	const usedCounter = currentTotpCounter(timestamp) + delta;

	// 重放拦截：同一个码在它的有效期内只能用一次
	if (
		params.lastUsedCounter !== null &&
		params.lastUsedCounter !== undefined &&
		usedCounter <= params.lastUsedCounter
	) {
		return null;
	}

	return usedCounter;
};

/**
 * 生成一批恢复码（明文）。
 *
 * 用 node:crypto 的 randomInt 而不是 Math.random —— 这是能替代 TOTP 的
 * 登录凭证，必须来自 CSPRNG。字符表已剔除易混淆字符，中间插一个连字符
 * 方便用户抄在纸上。
 *
 * @returns 形如 ["ABCDE-FGHJK", ...] 的明文恢复码数组
 */
export const generateRecoveryCodes = (): string[] => {
	const codes: string[] = [];

	for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
		let code = "";
		for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
			code += RECOVERY_CODE_ALPHABET[
				randomInt(RECOVERY_CODE_ALPHABET.length)
			] as string;
		}
		// 对半切开加连字符：ABCDE-FGHJK
		const half = Math.floor(RECOVERY_CODE_LENGTH / 2);
		codes.push(`${code.slice(0, half)}-${code.slice(half)}`);
	}

	return codes;
};

/**
 * 把用户输入的恢复码规整成入库时的形态：去掉所有非字符表字符、转大写。
 * 这样用户抄写时带不带连字符、有没有多打空格都能对上。
 */
export const normalizeRecoveryCode = (raw: string): string =>
	raw.toUpperCase().replace(/[^A-Z0-9]/g, "");

/**
 * 计算恢复码的存储摘要。
 *
 * 用 SHA-256 而非 argon2：恢复码是服务端生成的高熵随机串，没有弱口令字典
 * 攻击面，慢哈希毫无收益；而确定性摘要能让校验退化成一次
 * `WHERE code_hash = ?` 查询，不必把 N 条记录逐个 verify。
 */
export const hashRecoveryCode = (code: string): string =>
	createHash("sha256").update(normalizeRecoveryCode(code)).digest("hex");
