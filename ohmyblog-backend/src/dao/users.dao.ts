import { eq, or } from "drizzle-orm";
import { db } from "../../db/connection";
import { users } from "../../db/schema";

export type NewUser = typeof users.$inferInsert;

class UsersDao {
	/**
	 * 创建用户
	 * @param user 用户实体，包含用户名、邮箱、密码哈希等
	 * @returns 新创建的用户记录
	 */
	async createUser(user: NewUser) {
		const result = await db.insert(users).values(user).returning();
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
			.from(users)
			.where(or(eq(users.email, identifier), eq(users.username, identifier)))
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
			.from(users)
			.where(eq(users.uuid, uuid))
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
			.select({ uuid: users.uuid })
			.from(users)
			.where(or(eq(users.username, username), eq(users.email, email)))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * 检查是否存在管理员用户
	 * @returns 是否已存在至少一个管理员
	 */
	async hasAnyAdmin() {
		const result = await db
			.select({ uuid: users.uuid })
			.from(users)
			.where(eq(users.role, "admin"))
			.limit(1);
		return result.length > 0;
	}

	/**
	 * 将状态改为激活
	 * @param uuid 用户唯一标识
	 */
	async activateUser(uuid: string) {
		await db
			.update(users)
			.set({
				status: "active",
			})
			.where(eq(users.uuid, uuid));
	}

	/**
	 * 更新最后登录时间
	 * @param uuid 用户唯一标识
	 */
	async updateLastLogin(uuid: string) {
		await db
			.update(users)
			.set({ lastLoginAt: new Date() })
			.where(eq(users.uuid, uuid));
	}

	/**
	 * 更新头像 URL
	 * @param uuid 用户唯一标识
	 * @param avatar_url 头像访问路径
	 */
	async updateAvatarUrl(uuid: string, avatarUrl: string) {
		await db
			.update(users)
			.set({ avatarUrl })
			.where(eq(users.uuid, uuid));
	}
}

export const usersDao = new UsersDao();
