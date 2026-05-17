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
import { getClientIp } from "../utils/getClientIp";
import { isProduction } from "../utils/runtime";

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
					const user = await authService.login(
						body.identifier,
						body.password,
						ip,
					);

					const token = await jwt.sign({
						uuid: user.uuid,
						role: user.role,
						username: user.username,
					});

					cookie.auth_token.set({
						value: token,
						httpOnly: true,
						secure: isProduction(),
						maxAge: 7 * 86400,
						path: "/",
						sameSite: isProduction() ? "strict" : "lax",
					});

					return {
						message: "登录成功",
						user: {
							uuid: user.uuid,
							username: user.username,
							role: user.role,
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
			// === 忘记密码 - 发送验证码 ===
			.post(
				"/forgot-password",
				async ({ body, request, server }) => {
					const ip = getClientIp({ request, server });
					await authService.forgotPassword(body.email, ip);
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
					cookie.auth_token.remove();
					return { message: "登出成功" };
				},
				{
					detail: { summary: "退出登录" },
				},
			),
);
