// src/plugins/adminGuard.ts
import { userDao } from "../daos/user.dao";
import { createRoleGuard } from "./auth.plugin";

/**
 * 若系统已有管理员，则强制需要 admin；否则放行（用于初始化阶段）
 *
 * hasAdmin 状态由 userDao.hasAnyAdmin 内部缓存维护：
 * 第一个 admin 创建时 createUser 自动把缓存置 true，之后不再查库
 */
// biome-ignore lint/suspicious/noExplicitAny: Elysia context is dynamically extended by plugins
export const ensureAdminIfExists = async (ctx: any) => {
	const exists = await userDao.hasAnyAdmin();
	if (!exists) return;

	// 复用 auth 插件的角色校验逻辑，保持一致
	const guard = createRoleGuard("admin");
	await guard(ctx);
};
