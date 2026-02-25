import { Database } from "bun:sqlite";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DB_PATH } from "../src/constants";
import { logger } from "../src/plugins/logger.plugin";
import * as schema from "./schema";

// 1. 路径定义
const MIGRATIONS_FOLDER = join(process.cwd(), "db", "drizzle");

// 2. 初始化连接
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema, logger: true });

// 3. 自动执行数据库迁移
// 顶层 await 确保程序启动前表结构已经就绪
try {
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	logger.info("✅ 数据库同步成功");
} catch (error) {
	logger.error({ err: error }, "❌ 数据库同步失败");
}
