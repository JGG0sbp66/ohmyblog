// src/plugins/adminGuard.ts
import { usersDao } from "../dao/users.dao";
import { createRoleGuard } from "./auth.plugin";

let hasAdminCache: boolean | null = null;

/**
 * 标记系统已有管理员，后续不再查库
 */
export const markHasAdmin = () => {
	hasAdminCache = true;
};

/**
 * 缓存模式获取是否存在管理员
 * @returns 是否已存在管理员用户
 */
const hasAdmin = async () => {
	if (hasAdminCache === null) {
		hasAdminCache = await usersDao.hasAnyAdmin();
	}
	return hasAdminCache;
};

/**
 * 若系统已有管理员，则强制需要 admin；否则放行（用于初始化阶段）
 */
export const ensureAdminIfExists = async (ctx: any) => {
	const exists = await hasAdmin();
	if (!exists) return;

	// 复用 auth 插件的角色校验逻辑，保持一致
	const guard = createRoleGuard("admin");
	await guard(ctx);
};
