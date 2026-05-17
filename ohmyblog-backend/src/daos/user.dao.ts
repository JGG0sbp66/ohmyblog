import { eq, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { user } from "../../db/schema";

export type NewUser = typeof user.$inferInsert;

// hasAnyAdmin 是高频调用（healthRoute 每次请求都会查），但变化只有一次：
// 系统初始化时第一个 admin 用户创建。之后永远是 true。
// 所以用一个本地 boolean 缓存，true 时不再触达数据库。
let hasAdminCache: boolean | null = null;

class UserDao {
	/**
	 * 创建用户
	 * @param userData 用户实体，包含用户名、邮箱、密码哈希等
	 * @returns 新创建的用户记录
	 */
	async createUser(userData: NewUser) {
		const result = await db.insert(user).values(userData).returning();
		// 第一个 admin 注册成功后立即把缓存置 true，避免下一次查库
		if (userData.role === "admin") {
			hasAdminCache = true;
		}
		return result[0];
	}

	/**
	 * 根据邮箱或用户名查找用户 (用于登录)
	 * @param identifier 用户名或邮箱
	 * @returns 用户记录，未找到返回 null
	 */
	async findByIdentifier(identifier: string) {
		const result = await db
			.select()
			.from(user)
			.where(or(eq(user.email, identifier), eq(user.username, identifier)))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 根据 UUID 查找 (用于获取个人信息)
	 * @param uuid 用户唯一标识
	 * @returns 用户记录或 null
	 */
	async findById(uuid: string) {
		const result = await db
			.select()
			.from(user)
			.where(eq(user.uuid, uuid))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 检查是否存在 (注册查重)
	 * @param username 用户名
	 * @param email 邮箱
	 * @returns 是否已有同名或同邮箱用户
	 */
	async checkExists(username: string, email: string) {
		const result = await db
			.select({ uuid: user.uuid })
			.from(user)
			.where(or(eq(user.username, username), eq(user.email, email)))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * 查找第一个管理员用户（用于系统通知邮件等场景）
	 * @returns 管理员用户记录或 null
	 */
	async findAdmin() {
		const result = await db
			.select()
			.from(user)
			.where(eq(user.role, "admin"))
			.limit(1);
		return result[0] || null;
	}

	/**
	 * 检查是否存在管理员用户
	 * 命中本地 boolean 缓存（true 永不失效，false 每次回源），
	 * 用于 healthRoute 等高频调用场景
	 * @returns 是否已存在至少一个管理员
	 */
	async hasAnyAdmin() {
		if (hasAdminCache === true) return true;
		const result = await db
			.select({ uuid: user.uuid })
			.from(user)
			.where(eq(user.role, "admin"))
			.limit(1);
		const exists = result.length > 0;
		if (exists) hasAdminCache = true;
		return exists;
	}

	/**
	 * 将状态改为激活
	 * @param uuid 用户唯一标识
	 */
	async activateUser(uuid: string) {
		await db
			.update(user)
			.set({
				status: "active",
			})
			.where(eq(user.uuid, uuid));
	}

	/**
	 * 更新用户信息
	 * @param uuid 用户唯一标识
	 * @param userData 待更新的数据
	 */
	async update(uuid: string, userData: Partial<NewUser>) {
		const result = await db
			.update(user)
			.set(userData)
			.where(eq(user.uuid, uuid))
			.returning();
		return result[0];
	}

	/**
	 * 更新最后登录时间和 IP
	 * @param uuid 用户唯一标识
	 * @param ip 本次登录 IP
	 */
	async updateLastLogin(uuid: string, ip: string) {
		await db
			.update(user)
			.set({ lastLoginAt: new Date(), lastLoginIp: ip })
			.where(eq(user.uuid, uuid));
	}
}

export const userDao = new UserDao();
