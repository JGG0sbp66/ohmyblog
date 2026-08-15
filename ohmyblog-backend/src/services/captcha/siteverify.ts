// src/services/captcha/siteverify.ts
//
// Turnstile / hCaptcha / reCAPTCHA v3 用的是同一套协议：往服务商的 siteverify
// 端点 POST 一个表单（secret + 前端拿到的一次性 token），对方回一个
// { success, "error-codes": [...] }。所以三家共用这一份实现，按 provider 换个
// URL 就行 —— 拆成三个文件只是把同一段代码抄三遍。
//
// 真正需要独立实现的是腾讯云 / 阿里云那种要引 SDK、算签名的（暂不支持）。
// 等它们进来时，在 captcha.service 里按 provider 分派到另一个模块即可，
// 文件是按「协议」分的，不是按厂商名分的。

import {
	RECAPTCHA_DEFAULT_MIN_SCORE,
	type TCaptchaProvider,
} from "../../../db/constants/captcha.constants";
import { logger } from "../../plugins/logger.plugin";

const log = logger.withTag("CaptchaVerify");

/** 各家的校验端点 */
const SITEVERIFY_ENDPOINTS: Record<TCaptchaProvider, string> = {
	turnstile: "https://challenges.cloudflare.com/turnstile/v0/siteverify",
	hcaptcha: "https://api.hcaptcha.com/siteverify",
	recaptcha: "https://www.google.com/recaptcha/api/siteverify",
};

/** 向服务商求证的超时。第三方抖动不该把登录接口一起拖死 */
const VERIFY_TIMEOUT_MS = 5_000;

export interface CaptchaVerifyResult {
	/**
	 * 这次校验过没过。
	 *
	 * 刻意不叫 success：responsePlugin 见到带 success 字段的对象会当成
	 * 「已经格式化过」而原样放行（见 response.plugin.ts），一旦有人把这个
	 * 结果直接返给路由层，响应就会少掉统一外壳，前端 unwrap() 随即把
	 * passed=false 当成业务错误抛出去。换个名字，从源头上不给踩的机会。
	 */
	passed: boolean;
	/**
	 * 服务商给的错误码，例如 invalid-input-secret（密钥填错了）、
	 * timeout-or-duplicate（token 过期或已用过）。
	 *
	 * 只给后台的「测试」按钮看 —— 站长排查配置全靠它。对外的失败响应一律是
	 * CAPTCHA_FAILED_MESSAGE 那一句，绝不带这些细节，否则等于告诉爆破者
	 * 他卡在哪一步。
	 */
	errorCodes: string[];
	/**
	 * reCAPTCHA v3 这次实际打出的分，另外两家没有这个概念。
	 * 同样只给测试按钮看：站长照着实际分数调阈值，比对着文档瞎猜靠谱。
	 */
	score?: number;
}

/** siteverify 的响应体，三家共用的字段 */
interface SiteverifyResponse {
	success?: boolean;
	score?: number;
	"error-codes"?: string[];
}

/**
 * 拿一次性 token 去问服务商这是不是真人。
 *
 * @param params.provider 服务商
 * @param params.secretKey 服务端密钥
 * @param params.token 前端验证框产出的一次性凭证
 * @param params.ip 客户端 IP，作为辅助信号带给服务商
 * @param params.minScore reCAPTCHA v3 的通过分数线，另外两家忽略；
 *                        不传则用 RECAPTCHA_DEFAULT_MIN_SCORE
 */
export const verifyWithProvider = async (params: {
	provider: TCaptchaProvider;
	secretKey: string;
	token: string;
	ip: string;
	minScore?: number;
}): Promise<CaptchaVerifyResult> => {
	const { provider, secretKey, token, ip } = params;

	const form = new URLSearchParams({ secret: secretKey, response: token });
	// 三家都接受 remoteip 作为辅助信号。这个 IP 准不准取决于 TRUST_PROXY
	// 配得对不对（见 utils/getClientIp.ts），配错顶多让服务商的判断不准，
	// 不会直接误伤 —— 所以拿不到就不带，不必因此拒绝校验
	if (ip) form.set("remoteip", ip);

	let res: Response;
	try {
		res = await fetch(SITEVERIFY_ENDPOINTS[provider], {
			method: "POST",
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: form,
			signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
		});
	} catch (err) {
		// 网络不通、DNS 挂了、超时都落到这里，一律判为不通过。
		//
		// 「问不到」和「答案是否」在这里没法区分，只能选一边：放行等于验证码
		// 静默失效，挡住等于服务商不可达时相关入口全进不去（包括登录）。
		// 这里选了挡住 —— 站长真被锁在外面时，把数据库里 captcha 那行的
		// enabled 改成 false 即可解除。
		log.error({ err, provider }, "向验证码服务商求证失败");
		return { passed: false, errorCodes: ["request-failed"] };
	}

	// 解析失败不算致命：非 2xx 时响应体可能是网关的 HTML 错误页，
	// 此时下面会退回 http-<状态码>
	let payload: SiteverifyResponse = {};
	try {
		payload = (await res.json()) as SiteverifyResponse;
	} catch {
		payload = {};
	}

	const errorCodes = payload["error-codes"] ?? [];

	if (!res.ok) {
		// Cloudflare 在 400 的响应体里照样给 error-codes，而那恰恰是最有用的
		// 一条：invalid-input-secret 意味着密钥填错了，直接告诉站长即可。
		// 丢掉它只留一个 http-400，后台的测试按钮就没法说人话了
		log.error(
			{ provider, status: res.status, errorCodes },
			"验证码服务商返回了非 2xx 状态",
		);
		return {
			passed: false,
			errorCodes: errorCodes.length > 0 ? errorCodes : [`http-${res.status}`],
		};
	}

	if (!payload.success) {
		return { passed: false, errorCodes };
	}

	if (provider === "recaptcha") {
		// v3 的 success=true 只说明 token 本身有效，还得看分够不够
		const threshold = params.minScore ?? RECAPTCHA_DEFAULT_MIN_SCORE;
		const score = payload.score ?? 0;

		if (score < threshold) {
			log.warn({ score, threshold }, "reCAPTCHA 分数低于阈值，判定为机器人");
			return {
				passed: false,
				errorCodes: [...errorCodes, "low-score"],
				score,
			};
		}

		return { passed: true, errorCodes: [], score };
	}

	return { passed: true, errorCodes: [] };
};
