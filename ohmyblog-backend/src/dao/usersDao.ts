import { eq, or } from "drizzle-orm";
import { db } from "../../db/index";
import { users } from "../../db/schema";

export type NewUser = typeof users.$inferInsert;

class UsersDao {
    /**
     * 创建用户
     */
    async createUser(user: NewUser) {
        const result = await db.insert(users).values(user).returning();
        return result[0];
    }

    /**
     * 根据邮箱或用户名查找用户 (用于登录)
     */
    async findByIdentifier(identifier: string) {
        const result = await db.select()
            .from(users)
            .where(or(
                eq(users.email, identifier),
                eq(users.username, identifier),
            ))
            .limit(1);
        return result[0] || null;
    }

    /**
     * 根据 UUID 查找 (用于获取个人信息)
     */
    async findById(uuid: string) {
        const result = await db.select()
            .from(users)
            .where(eq(users.uuid, uuid))
            .limit(1);
        return result[0] || null;
    }

    /**
     * 检查是否存在 (注册查重)
     */
    async checkExists(username: string, email: string) {
        const result = await db.select({ uuid: users.uuid })
            .from(users)
            .where(or(
                eq(users.username, username),
                eq(users.email, email),
            ))
            .limit(1);
        return result.length > 0;
    }

    /**
     * 检查是否存在管理员用户
     */
    async hasAnyAdmin() {
        const result = await db.select({ uuid: users.uuid })
            .from(users)
            .where(eq(users.role, "admin"))
            .limit(1);
        return result.length > 0;
    }

    /**
     * 将状态改为激活
     */
    async activateUser(uuid: string) {
        await db.update(users)
            .set({
                status: "active",
            })
            .where(eq(users.uuid, uuid));
    }

    /**
     * 更新最后登录时间
     */
    async updateLastLogin(uuid: string) {
        await db.update(users)
            .set({ lastLoginAt: new Date() })
            .where(eq(users.uuid, uuid));
    }
}

export const usersDao = new UsersDao();
