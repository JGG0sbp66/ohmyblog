// src/constants.ts
import { join } from "node:path";

/**
 * 项目物理路径义
 */

/** 所有数据的根目录 (如 SQLite 数据库、.env 等) */
export const DATA_DIR = join(process.cwd(), "data");

/** 用户上传文件的存放总目录 */
export const UPLOADS_DIR = join(DATA_DIR, "uploads");

/** 系统级静态资源目录 (如 Favicon、网站横幅等) */
export const SYSTEM_UPLOADS_DIR = join(UPLOADS_DIR, "system");

/** 运行日志存放目录 */
export const LOGS_DIR = join(process.cwd(), "logs");

/** 自动化生成的环境变量配置文件路径 */
export const ENV_PATH = join(DATA_DIR, ".env");

/** SQLite 数据库文件的物理存储路径 */
export const DB_PATH = join(DATA_DIR, "sqlite.db");
