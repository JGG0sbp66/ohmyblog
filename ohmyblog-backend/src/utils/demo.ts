// src/utils/demo.ts
import { userDao } from "../daos/user.dao";
import type { JwtUserPayload } from "../plugins/auth.plugin";
import { isDemo } from "./runtime";

/**
 * 演示模式注入的虚拟管理员 uuid。数据库里不存在这个用户，
 * 因此它既能通过 ensureAdminIfExists，又能被写入闸门一眼认出来。
 */
export const DEMO_USER_UUID = "__demo__";

/** 演示模式下发给未登录游客的虚拟身份 */
export const demoUser: JwtUserPayload = {
	uuid: DEMO_USER_UUID,
	role: "admin",
	username: "demo",
};

/** 判断某个 context.user 是不是虚拟演示身份（真实登录的管理员不会命中） */
export const isDemoUser = (user: unknown): boolean =>
	(user as JwtUserPayload | null | undefined)?.uuid === DEMO_USER_UUID;

/**
 * 演示限制是否真正生效：开关打开 **且** 系统已初始化。
 *
 * 库里还没有 admin 时整个不生效，setup 向导照常可用——语义和
 * ensureAdminIfExists 保持一致，避免代码里出现两套「是否已初始化」的规则。
 *
 * 非演示部署下 isDemo() 先短路，不会多一次数据库查询；
 * hasAnyAdmin 内部有单向缓存，建出 admin 后也不再触达数据库。
 */
export const isDemoActive = async (): Promise<boolean> =>
	isDemo() && (await userDao.hasAnyAdmin());

/** 未登录时的用户身份：演示模式生效则给虚拟管理员，否则为 null */
export const resolveAnonymousUser = async (): Promise<JwtUserPayload | null> =>
	(await isDemoActive()) ? demoUser : null;
