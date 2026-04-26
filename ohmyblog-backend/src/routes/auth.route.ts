import { Elysia } from "elysia";
import { LoginDTO, RegisterDTO, UpdateAccountDTO } from "../dtos/auth.dto";
import { config } from "../env";
import { authPlugin } from "../plugins/auth.plugin";
import { BusinessError } from "../plugins/errors";
import { authService } from "../services/auth.service";

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
				async ({ body, jwt, cookie }) => {
					const user = await authService.login(body.identifier, body.password);

					const token = await jwt.sign({
						uuid: user.uuid,
						role: user.role,
						username: user.username,
					});

					cookie.auth_token.set({
						value: token,
						httpOnly: true,
						secure: config.NODE_ENV === "production",
						maxAge: 7 * 86400,
						path: "/",
						sameSite: config.NODE_ENV === "production" ? "strict" : "lax",
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
