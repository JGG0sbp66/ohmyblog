// src/dtos/captcha.dto.ts
import { type Static, t } from "elysia";
import { captchaProviders } from "../../db/constants/captcha.constants";
import { tStringEnum } from "../utils/typebox";

/**
 * 挂了验证码的入口在请求体里多带的那个字段。
 *
 * 用 spread 塞进 LoginDTO / ForgotPasswordDTO / ApplyFriendLinkDTO
 * （与 config.dto.ts 里 ConfigMetaDTO 同一个写法），好处是这段说明只写一遍，
 * 三处不会各自漂移。
 *
 * 可选而不是必填：验证码默认关闭，也可以只开其中一两个入口 —— 设成必填的话
 * 没开验证码时所有请求都会被 DTO 挡下。「这个入口该不该带」只有
 * captchaService.ensureVerified 知道，判断留在那里。
 */
export const CaptchaTokenField = {
	captchaToken: t.Optional(
		t.String({
			maxLength: 4096,
			description: "人机验证的一次性凭证，未启用验证码时无需携带",
		}),
	),
};

/**
 * 后台「测试」按钮的请求体。
 *
 * 密钥从请求体里传，而不是读已保存的配置 —— 站长的用法是「填完先试试再存」，
 * 与 /email/test-smtp 一致（那边同样把 SMTP 账密整个塞在 body 里）。
 * 这三个字段缺一不可，所以都是必填。
 */
export const CaptchaTestDTO = t.Object({
	provider: tStringEnum(captchaProviders, {
		description: "要测试的验证码服务商",
		error: "captcha.provider_invalid",
	}),
	secretKey: t.String({
		minLength: 1,
		maxLength: 255,
		description: "要测试的服务端密钥",
		error: "captcha.secret_key_required",
	}),
	token: t.String({
		minLength: 1,
		description: "设置页里那个验证框刚产出的一次性凭证",
		error: "captcha.token_required",
	}),
	// 只有测 reCAPTCHA v3 时才有意义：让站长用表单里当前填的阈值试，
	// 而不是用已保存的那个。不传则按 RECAPTCHA_DEFAULT_MIN_SCORE 算
	minScore: t.Optional(
		t.Number({
			minimum: 0,
			maximum: 1,
			description: "reCAPTCHA v3 的通过分数线（0~1，越高越严格）",
			error: "captcha.recaptcha_score_range",
		}),
	),
});

export type TCaptchaTestDTO = Static<typeof CaptchaTestDTO>;
