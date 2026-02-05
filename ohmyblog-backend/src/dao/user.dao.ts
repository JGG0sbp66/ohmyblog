import { eq, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { user } from "../../db/schema";

export type NewUser = typeof user.$inferInsert;

class UserDao {
	/**
	 * 创建用户
	 * @param userData 用户实体，包含用户名、邮箱、密码哈希等
	 * @returns 新创建的用户记录
	 */
	async createUser(userData: NewUser) {
		const result = await db.insert(user).values(userData).returning();
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
	 * 检查是否存在管理员用户
	 * @returns 是否已存在至少一个管理员
	 */
	async hasAnyAdmin() {
		const result = await db
			.select({ uuid: user.uuid })
			.from(user)
			.where(eq(user.role, "admin"))
			.limit(1);
		return result.length > 0;
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
	 * 更新最后登录时间
	 * @param uuid 用户唯一标识
	 */
	async updateLastLogin(uuid: string) {
		await db
			.update(user)
			.set({ lastLoginAt: new Date() })
			.where(eq(user.uuid, uuid));
	}

	/**
	 * 更新头像 URL
	 * @param uuid 用户唯一标识
	 * @param avatarUrl 头像访问路径
	 */
	async updateAvatarUrl(uuid: string, avatarUrl: string) {
		await db
			.update(user)
			.set({ avatarUrl })
			.where(eq(user.uuid, uuid));
	}
}

export const userDao = new UserDao();
