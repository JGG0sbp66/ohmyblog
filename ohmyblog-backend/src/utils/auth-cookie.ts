// src/utils/auth-cookie.ts
//
// 签发 auth_token 并写入 cookie 的唯一出口。
//
// 有两个调用点：普通登录（auth.route /login）和两步验证第二步
// （two-factor.route /verify）。这两处原本各自复制了一份 cookie 选项，
// 一旦要调 sameSite、有效期或 secure，漏改的那一份正好是登录相关的路径，
// 所以收拢成一份，宁可多一层间接。

import type { JwtUserPayload } from "../plugins/auth.plugin";
import { isProduction } from "./runtime";

/** auth_token cookie 的有效期（秒），7 天 */
export const AUTH_COOKIE_MAX_AGE = 7 * 86400;

/**
 * 用用户信息签发 JWT，并写入 httpOnly 的 auth_token cookie。
 *
 * @param jwt route 上下文里的 jwt 插件实例
 * @param cookie route 上下文里的 cookie 对象
 * @param user 已完成全部认证步骤的用户
 */
export const issueAuthCookie = async ({
	jwt,
	cookie,
	user,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: Elysia jwt 插件实例由上下文动态注入
	jwt: any;
	// biome-ignore lint/suspicious/noExplicitAny: Elysia cookie 代理对象由上下文动态注入
	cookie: any;
	user: JwtUserPayload;
}): Promise<void> => {
	const token = await jwt.sign({
		uuid: user.uuid,
		role: user.role,
		username: user.username,
	});

	cookie.auth_token.set({
		value: token,
		httpOnly: true,
		secure: isProduction(),
		maxAge: AUTH_COOKIE_MAX_AGE,
		path: "/",
		sameSite: isProduction() ? "strict" : "lax",
	});
};
