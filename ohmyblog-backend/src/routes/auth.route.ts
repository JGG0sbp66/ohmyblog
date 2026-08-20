import { Elysia } from "elysia";
import {
	ForgotPasswordDTO,
	LoginDTO,
	RegisterDTO,
	ResetPasswordDTO,
	UpdateAccountDTO,
} from "../dtos/auth.dto";
import { authPlugin } from "../plugins/auth.plugin";
import { BusinessError } from "../plugins/errors";
import { authService } from "../services/auth.service";
import { emailConfigService } from "../services/email/email-config.service";
import { issueAuthCookie } from "../utils/auth-cookie";
import { DEMO_USER_UUID, isDemoUser } from "../utils/demo";
import { getClientIp } from "../utils/getClientIp";
import { isProduction } from "../utils/runtime";
import { CHALLENGE_COOKIE_NAME } from "../utils/two-factor-challenge";

export const authRoute = new Elysia({ name: "authRoute" }).group(
	"/auth",
	{
		detail: { tags: ["Auth (认证)"] },
	},
	(app) =>
		app
			.use(authPlugin)
			// === 注册接口 ===
			.post(
				"/register",
				async ({ body, set }) => {
					const user = await authService.register(body);

					set.status = 201;

					return {
						message: "注册成功",
						user: {
							uuid: user.uuid,
							username: user.username,
							role: user.role,
						},
					};
				},
				{
					detail: { summary: "用户注册" },
					body: RegisterDTO,
				},
			)
			// === 登录接口 ===
			.post(
				"/login",
				async ({ body, jwt, cookie, request, server }) => {
					const ip = getClientIp({ request, server });
					const result = await authService.login(
						body.identifier,
						body.password,
						ip,
						body.captchaToken,
					);

					if (result.requiresTwoFactor) {
						const challengeCookie = cookie[CHALLENGE_COOKIE_NAME];
						if (!challengeCookie) {
							throw new Error("认证服务不可用：Cookie 插件未初始化");
						}
						challengeCookie.set({
							value: result.challenge.challengeId,
							httpOnly: true,
							secure: isProduction(),
							maxAge: result.challenge.expiresIn,
							path: "/",
							sameSite: isProduction() ? "strict" : "lax",
						});

						return {
							message: "请输入两步验证码",
							requiresTwoFactor: true,
							user: null,
						};
					}

					await issueAuthCookie({ jwt, cookie, user: result.user });

					return {
						message: "登录成功",
						requiresTwoFactor: false,
						user: {
							uuid: result.user.uuid,
							username: result.user.username,
							role: result.user.role,
						},
					};
				},
				{
					detail: { summary: "用户登录" },
					body: LoginDTO,
				},
			)
			// === 获取当前用户信息 ===
			.get(
				"/me",
				async ({ user }) => {
					if (!user) {
						throw new BusinessError("未登录或会话已过期", { status: 401 });
					}

					// 演示模式的虚拟身份在库里查不到，直接返回固定资料，
					// 否则 getMe 抛 404 会让前端守卫把游客弹回登录页
					if (isDemoUser(user)) {
						return {
							uuid: DEMO_USER_UUID,
							username: "demo",
							email: "demo@example.com",
							role: "admin",
							isDemo: true,
						};
					}

					return await authService.getMe(user.uuid);
				},
				{
					detail: { summary: "获取当前登录用户信息" },
				},
			)
			// === 更新当前账号信息 ===
			.patch(
				"/me",
				async ({ user, body }) => {
					if (!user) {
						throw new BusinessError("未登录或会话已过期", { status: 401 });
					}

					const updatedUser = await authService.updateAccount(user.uuid, body);
					return {
						message: "保存成功",
						user: {
							uuid: updatedUser.uuid,
							username: updatedUser.username,
							role: updatedUser.role,
						},
					};
				},
				{
					detail: { summary: "更新账号信息" },
					body: UpdateAccountDTO,
				},
			)
			// === 忘记密码 - 查询这条路是否可用 ===
			// 邮件服务没配置时，忘记密码流程走不通（服务端会静默失败，因为报错
			// 会让接口变成邮箱枚举器）。前端需要先问一下，好把用户引导到命令行
			// 恢复方式，而不是让他对着一个永远收不到邮件的表单反复提交。
			//
			// 只暴露一个与用户无关的布尔值，不涉及任何账号信息，可匿名访问。
			.get(
				"/forgot-password",
				async () => {
					return { available: await emailConfigService.isEmailUsable() };
				},
				{
					detail: {
						summary: "忘记密码 - 查询邮件服务是否可用",
						description:
							"返回 available=false 时前端应提示改用命令行重置（bun run reset-password）。",
					},
				},
			)
			// === 忘记密码 - 发送验证码 ===
			.post(
				"/forgot-password",
				async ({ body, request, server }) => {
					const ip = getClientIp({ request, server });
					await authService.forgotPassword(body.email, ip, body.captchaToken);
					// 无论邮箱是否存在，都返回同样的提示，防止接口被用来枚举有效邮箱
					return {
						message: "若邮箱存在，验证码已发送，请注意查收",
					};
				},
				{
					detail: {
						summary: "忘记密码 - 请求验证码",
						description: "出于安全考虑，无论邮箱是否注册都返回相同的成功提示。",
					},
					body: ForgotPasswordDTO,
				},
			)
			// === 重置密码 - 校验验证码并设置新密码 ===
			.post(
				"/reset-password",
				async ({ body }) => {
					await authService.resetPassword(
						body.email,
						body.code,
						body.newPassword,
					);
					return { message: "密码重置成功，请使用新密码登录" };
				},
				{
					detail: { summary: "忘记密码 - 提交验证码并重置密码" },
					body: ResetPasswordDTO,
				},
			)
			// === 登出接口 ===
			.post(
				"/logout",
				({ cookie }) => {
					cookie.auth_token?.remove();
					return { message: "登出成功" };
				},
				{
					detail: { summary: "退出登录" },
				},
			),
);
