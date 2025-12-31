import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "./schema";
import { join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { systemLogger } from "../src/plugins/logger";

// 1. 路径定义
// 使用 process.cwd() 确保在 Docker 或不同环境下路径的一致性
const DATA_DIR = join(process.cwd(), "data"); 
const DB_PATH = join(DATA_DIR, "sqlite.db");
const MIGRATIONS_FOLDER = join(process.cwd(), "db", "drizzle");

// 2. 自动创建数据目录
// 这是为了防止 Docker 挂载了一个不存在的物理目录导致报错
if (!existsSync(DATA_DIR)) {
    systemLogger.info(`📂 目录 ${DATA_DIR} 不存在，正在自动创建...`);
    mkdirSync(DATA_DIR, { recursive: true });
}

// 3. 初始化连接
const sqlite = new Database(DB_PATH);
export const db = drizzle(sqlite, { schema, logger: true });

// 4. 自动执行数据库迁移
// 顶层 await 确保程序启动前表结构已经就绪
try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    systemLogger.info("✅ 数据库同步成功");
} catch (error) {
    systemLogger.error({ err: error }, "❌ 数据库同步失败");
}