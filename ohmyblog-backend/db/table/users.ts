import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { sql } from 'drizzle-orm';

export const roles = ["admin", "user"] as const;
export const statuses = ["active", "inactive", "banned"] as const;

export const users = sqliteTable('users', {
  // uuid: UUID 格式，在 SQLite 中存储为 text
  uuid: text('uuid').primaryKey().$defaultFn(() => createId()),

  // 用户名, 唯一，长度 50
  username: text('username').notNull().unique(),

  // 邮箱地址, 唯一，长度 100
  email: text('email').notNull().unique(),

  // 加密后的密码哈希, 长度 255
  passwordHash: text('password_hash').notNull(),

  // 用户头像图片 URL, 允许为空
  avatarUrl: text('avatar_url'),

  // 用户个人简介或签名, 允许为空
  bio: text('bio'),

  // 用户角色: admin, user 等，默认 user
  role: text('role', { enum: roles }).default('user'),

  // 用户状态: active, inactive, banned 等，默认 inactive
  status: text('status', { enum: statuses }).default('inactive'),

  // 账户创建时间
  // mode: 'timestamp' 会自动将 JS Date 对象转为 SQLite 整数（Unix时间戳）
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`), // 数据库层面的默认值

  // 最后信息更新时间
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date()),

  // 最后登录时间
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }),

  // 邮箱验证状态: true/false
  // SQLite 没有布尔型，Drizzle 会用 0/1 自动映射
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false),
});