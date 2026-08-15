// db/constants/captcha.constants.ts
//
// 人机验证（CAPTCHA）的共享字面量。前后端都要用：
//   - 后端按 provider 分派到对应的校验实现，按 scene 决定这次该不该验
//   - 前端按 provider 加载对应的第三方脚本，按 scene 决定该不该显示验证框
// 与同目录其他 constants 一样保持零依赖（纯 as const + 派生类型），
// 前端可安全 import。

/**
 * 支持的验证码服务商。
 *
 * 这三家的接入方式是同一套：前端拿一次性 token，后端拿 token 去服务商换真伪，
 * 差别只在请求地址和响应字段名。腾讯云 / 阿里云需要引 SDK、算签名，
 * 套不进这个抽象，因此暂不支持。
 */
export const captchaProviders = ["turnstile", "hcaptcha", "recaptcha"] as const;
export type TCaptchaProvider = (typeof captchaProviders)[number];

/**
 * 可以挂验证码的入口。
 *
 * 共同点是「未登录也能打」且「失败没有成本」—— 正是爆破和灌水的落点。
 * 需要登录才能调的管理接口不在此列，它们的门槛已经是登录本身。
 */
export const captchaScenes = [
	"login",
	"forgotPassword",
	"friendApply",
] as const;
export type TCaptchaScene = (typeof captchaScenes)[number];

/**
 * 校验未通过时后端抛出的固定文案。
 *
 * 只有这一句：不区分「没带 token」「token 已用过」「服务商判定为机器人」。
 * 区分开对正常用户没有帮助，却能让攻击者摸清校验的边界。这句话与账号无关，
 * 所以不会像账号相关的差异化提示那样引入新的枚举面。
 *
 * 放进共享常量是因为前端要拿它和 catch 到的 message 做等值比较，据此重置
 * 验证框 —— token 是一次性的，不重置的话用户再点一次仍然必败。同样的理由
 * 见 two-factor.constants.ts 的 TWO_FACTOR_EXHAUSTED_MESSAGE。
 */
export const CAPTCHA_FAILED_MESSAGE = "人机验证未通过，请重试";

/**
 * reCAPTCHA v3 默认的通过分数线。
 *
 * 只有 reCAPTCHA v3 有这个概念 —— Turnstile 和 hCaptcha 只回答「是 / 否」，
 * 选了那两家时配置里根本不该出现这一项。v3 不下结论，只给一个 0.0~1.0 的
 * 可信度分：越接近 1 越像真人。所以**阈值调高 = 更严格**（更容易误杀真人），
 * 调低 = 更宽松。
 *
 * 0.5 是 Google 文档给的建议起点。站长可以在后台改，这里只是缺省值 ——
 * 前端也用它做推荐值提示，所以放在共享常量里。
 */
export const RECAPTCHA_DEFAULT_MIN_SCORE = 0.5;
