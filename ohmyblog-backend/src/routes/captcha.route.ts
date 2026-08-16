// src/routes/captcha.route.ts
import { Elysia } from "elysia";
import { CaptchaTestDTO } from "../dtos/captcha.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { captchaService } from "../services/captcha/captcha.service";
import { getClientIp } from "../utils/getClientIp";

/**
 * 验证码路由。
 *
 * 配置的增删改查走通用的 /api/config（与 smtp 一致），这里只放两个通用接口
 * 装不下的东西：
 *
 *   GET  /captcha       公开。那条配置不在公开白名单里，而登录页、忘记密码页、
 *                       友链申请表单恰恰都是未登录状态，读不到却又需要 siteKey
 *                       才能把验证框渲染出来。这里只吐渲染需要的字段，没有 secret
 *   POST /captcha/test  管理员。拿表单里当前填的密钥试一次，先试通再保存
 */
export const captchaRoute = new Elysia({ name: "captchaRoute" })
	.use(authPlugin)
	.group("/captcha", { detail: { tags: ["Captcha (人机验证)"] } }, (app) =>
		app
			.get("", () => captchaService.getPublicConfig(), {
				detail: {
					summary: "获取验证码公开配置（GET）",
					description:
						"未配置、未启用或密钥不全时返回 enabled=false，各场景开关一并为 false。",
				},
			})
			.post(
				"/test",
				async ({ body, request, server }) => {
					const ip = getClientIp({ request, server });
					const result = await captchaService.testCredential({ ...body, ip });

					return {
						// 字段名不能叫 success：responsePlugin 见到带 success 的
						// 对象会认为已经格式化过而原样放行（见 response.plugin.ts），
						// 于是这个响应就不带统一外壳了，前端 unwrap() 会把
						// success:false 当成业务错误抛出去，测试结果永远读不到
						passed: result.passed,
						// 服务商给的错误码原样带出来，站长据此判断是密钥填错了
						// （invalid-input-secret）还是 token 过期了
						// （timeout-or-duplicate）。仅此一处对外暴露细节，
						// 因为调用方是已登录的管理员，不是待鉴别的访客
						errorCodes: result.errorCodes,
						// reCAPTCHA v3 实际打出的分，站长照着它调阈值；
						// 另外两家没有这个概念，返回 null
						score: result.score ?? null,
					};
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: {
						summary: "测试验证码密钥（POST）",
						description:
							"用请求体里的密钥和一次性 token 向服务商求证一次，不读也不改已保存的配置。",
					},
					body: CaptchaTestDTO,
				},
			),
	);
