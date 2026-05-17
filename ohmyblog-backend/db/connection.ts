import { Database } from "bun:sqlite";
import { join } from "node:path";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { DB_PATH } from "../src/constants";
import { logger } from "../src/plugins/logger.plugin";
import { isProduction } from "../src/utils/runtime";
import * as schema from "./schema";

// 1. 路径定义
const MIGRATIONS_FOLDER = join(process.cwd(), "db", "drizzle");

// 2. 初始化连接
const sqlite = new Database(DB_PATH);

// journal_mode = WAL
//   开启 Write-Ahead Log。读写可并发（写互斥，但读不被写阻塞）。
//   这是 SQLite 在多并发读写场景下最重要的一个开关。
//   会在数据库旁边产生 *.db-wal / *.db-shm 文件，备份时一起拷贝。
//
// synchronous = NORMAL
//   fsync 频率从 FULL 降到 NORMAL，吞吐显著提升。
//   极端断电场景下可能丢失最后一次未 checkpoint 的事务，对博客可接受。
//
// cache_size = -64000
//   page cache 64 MB（负数表示 KB）。默认 2 MB 偏小，热点页频繁淘汰。
//   服务器内存富余的情况下吃多点，命中率显著提升。
//
// busy_timeout = 5000
//   高并发下 SQLITE_BUSY 自动重试最多 5 秒，避免压力下偶发失败。
sqlite.run("PRAGMA journal_mode = WAL;");
sqlite.run("PRAGMA synchronous = NORMAL;");
sqlite.run("PRAGMA cache_size = -64000;");
sqlite.run("PRAGMA busy_timeout = 5000;");

// Drizzle 仅在非生产环境打印 SQL 日志
//   生产高 QPS 下每条 SQL 都打 console 会显著拖慢 RPS 并增大 GC 压力。
export const db = drizzle(sqlite, {
	schema,
	logger: !isProduction(),
});

// 3. 自动执行数据库迁移
// 顶层 await 确保程序启动前表结构已经就绪
try {
	await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
	logger.info("✅ 数据库同步成功");
} catch (error) {
	logger.error({ err: error }, "❌ 数据库同步失败");
}
