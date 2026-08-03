// src/plugins/demo.plugin.ts
import { Elysia } from "elysia";
import { isDemoUser } from "../utils/demo";
import { authPlugin } from "./auth.plugin";
import { BusinessError } from "./errors";

/** 会改动数据的 HTTP 方法 */
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/** 演示模式下仍然放行的写接口 */
const DEMO_ALLOWED_PATHS = new Set([
	"/api/auth/login", // 站长仍要能登进来接管
	"/api/auth/logout",
	"/api/public/friends/apply", // 前台公开功能，属于演示内容的一部分
]);

/**
 * 演示模式写入闸门
 *
 * 按 **HTTP 方法** 拦截而不是维护一份写接口清单：以后新增任何写路由都默认
 * 被挡住，不需要来这里登记，也就不会随时间腐化。
 *
 * 只对 auth.plugin 注入的虚拟身份生效——真实登录的管理员拿到的是真 JWT，
 * uuid 不等于 DEMO_USER_UUID，完全不受限制，照常管理演示站。
 *
 * 「演示限制是否生效」的判定只存在于 auth.plugin 的 derive 一处
 * （决定注不注入虚拟身份），这里不重复判断，避免两处逻辑漂移。
 *
 * .use(authPlugin) 是为了把它的全局 derive 拉进同一作用域，
 * 保证本钩子执行时 ctx.user 已经就绪。
 */
export const demoPlugin = new Elysia({ name: "demoPlugin" })
	.use(authPlugin)
	.onBeforeHandle({ as: "global" }, ({ request, path, user }) => {
		if (!isDemoUser(user)) return;
		if (!WRITE_METHODS.has(request.method)) return;
		if (DEMO_ALLOWED_PATHS.has(path)) return;

		throw new BusinessError("演示模式下不可修改数据", { status: 403 });
	});
