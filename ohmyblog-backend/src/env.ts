import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import {
	DATA_DIR,
	DB_PATH,
	ENV_PATH,
	LOGS_DIR,
	SYSTEM_UPLOADS_DIR,
	UPLOADS_DIR,
} from "./constants";
import { logger } from "./plugins/logger.plugin";

// =================================================================
// 1. 配置定义中心（同时用于生成 .env 和类型推断）
// =================================================================
const configSchema = {
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	PORT: z.coerce.number().default(3000),
	JWT_SECRET: z.string(),
	JWT_EXP: z.string().default("7d"),
} as const;

// 配置描述（用于生成 .env 文件的注释）
const configDesc = {
	NODE_ENV: "运行环境 (development | production)",
	PORT: "端口",
	JWT_SECRET: "JWT 签名密钥 (自动生成强密码)",
	JWT_EXP:
		"Token 过期时间 (支持格式: 7d=7天, 24h=24小时, 60m=60分钟, 3600s=3600秒)",
} as const;

// 默认值映射（用于生成 .env 文件）
const configDefaults = {
	NODE_ENV: "development",
	PORT: "3000",
	JWT_SECRET: () => randomBytes(32).toString("hex"), // 函数表示自动生成
	JWT_EXP: "7d",
} as const;

// =================================================================
// 2. 自动化引擎 & 目录初始化
// =================================================================
const REQUIRED_DIRS = [DATA_DIR, UPLOADS_DIR, SYSTEM_UPLOADS_DIR, LOGS_DIR];

for (const dir of REQUIRED_DIRS) {
	if (!existsSync(dir)) {
		logger.info(`📂 目录 ${dir} 不存在，正在自动创建...`);
		mkdirSync(dir, { recursive: true });
	}
}

export {
	DATA_DIR,
	DB_PATH,
	ENV_PATH,
	LOGS_DIR,
	SYSTEM_UPLOADS_DIR,
	UPLOADS_DIR,
};

/**
 * 初始化配置文件，若 data/.env 不存在则自动生成，并返回 kv 映射
 * @returns 合并后的环境变量映射
 */
async function initConfig() {
	const file = Bun.file(ENV_PATH);
	const envMap: Record<string, string> = {};

	if (!(await file.exists())) {
		logger.warn(`⚙️  检测到 data/.env 不存在，正在自动生成...`);

		let fileContent = `# Auto-generated config\n`;

		for (const key of Object.keys(configSchema)) {
			const desc = configDesc[key as keyof typeof configDesc];
			const defaultValue = configDefaults[key as keyof typeof configDefaults];

			// 获取值：如果是函数则调用，否则直接使用
			const val =
				typeof defaultValue === "function" ? defaultValue() : defaultValue;

			envMap[key] = String(val);
			fileContent += `\n# ${desc}\n${key}=${val}\n`;

			// 如果是自动生成的，记录日志
			if (typeof defaultValue === "function") {
				logger.info(`🔑 已自动生成安全配置 [${key}]: \x1b[36m${val}\x1b[0m`);
			}
		}

		await Bun.write(ENV_PATH, fileContent);
		logger.info(`✅ 配置文件已创建: ${ENV_PATH}`);
	} else {
		const text = await file.text();
		text.split("\n").forEach((line) => {
			const [k, ...v] = line.trim().split("=");
			if (k && !k.startsWith("#")) envMap[k] = v.join("=").trim();
		});
	}

	return envMap;
}

const loadedEnv = await initConfig();
// 命令行环境变量优先级更高（process.env 覆盖 .env 文件）
const mergedEnv = { ...loadedEnv, ...process.env };

// =================================================================
// 3. 构建 Schema 并导出类型安全的 config
// =================================================================
const envSchema = z.object(configSchema);

const parsed = envSchema.safeParse(mergedEnv);

if (!parsed.success) {
	const errorDetails = parsed.error.issues.map((issue) => ({
		field: issue.path.join(".") || "ROOT",
		message: issue.message,
		code: issue.code,
	}));
	// 使用 Logger 记录严重错误
	logger.fatal({ err: errorDetails }, "❌ 配置校验失败，服务无法启动");
	setTimeout(() => process.exit(1), 100);
}

export const config = parsed.data as z.infer<typeof envSchema>;
