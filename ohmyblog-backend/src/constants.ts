// src/constants.ts
import { join } from "node:path";

/**
 * 项目物理路径定义
 */
export const DATA_DIR = join(process.cwd(), "data");
export const UPLOADS_DIR = join(DATA_DIR, "uploads");
export const SYSTEM_UPLOADS_DIR = join(UPLOADS_DIR, "system");
export const LOGS_DIR = join(process.cwd(), "logs");
export const ENV_PATH = join(DATA_DIR, ".env");
export const DB_PATH = join(DATA_DIR, "sqlite.db");
