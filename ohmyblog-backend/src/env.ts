import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { z } from "zod";
import {
	DATA_DIR,
	ENV_PATH,
	LOGS_DIR,
	SOCIAL_UPLOADS_DIR,
	SQLITE_DIR,
	SYSTEM_UPLOADS_DIR,
	UPLOADS_DIR,
} from "./constants";
import { logger } from "./plugins/logger.plugin";

// =================================================================
// 1. 配置定义中心（同时用于生成 .env 和类型推断）
// =================================================================
const configSchema = {
	NODE_ENV: z.enum(["development", "production"]).default("development"),
	PORT: z.preprocess(
		// PORT= 留空（CI 模板、docker-compose 常见）若不归一为 undefined，
		// 会被 coerce 成 0 通过校验，listen(0) 静默监听随机端口
		(v) => (v === "" ? undefined : v),
		z.coerce.number().int().min(1).max(65535).default(3000),
	),
	JWT_SECRET: z.string(),
	JWT_EXP: z.string().default("7d"),
	// 与 NODE_ENV 正交的开关：演示站同样是 production 部署，只是额外禁写
	// 用 string + transform 而非 z.coerce.boolean()，后者会把字符串 "false" 转成 true；
	// 也不用 z.enum，避免值拼错时触发 fatal 让服务起不来
	DEMO_MODE: z
		.string()
		.default("false")
		.transform((v) => {
			const normalized = v.trim().toLowerCase();
			return normalized === "true" || normalized === "1";
		}),
	// 前置反向代理的层数，决定 getClientIp 能不能信任 X-Forwarded-For。
	//
	// 语义是「从 XFF 链条右端数第几个才是真实客户端」，而不是布尔开关：
	// nginx 的 $proxy_add_x_forwarded_for 是在客户端送来的值后面**追加**真实
	// 对端地址，所以链条最左边那一段永远是客户端自己写的、不可信；可信的是
	// 右边由自己的代理追加的部分。层数不对就会取错人。
	//   0 = 直连，完全忽略 XFF（默认，也是最安全的）
	//   1 = 只有一层自己的 nginx / Caddy
	//   2 = Cloudflare 或其他 CDN 再套一层 nginx
	// 为了少踩坑，也接受 true（等价于 1）/ false（等价于 0）
	TRUST_PROXY: z
		.string()
		.default("0")
		.transform((v) => {
			const normalized = v.trim().toLowerCase();
			if (normalized === "true") return 1;
			if (normalized === "false" || normalized === "") return 0;
			const parsed = Number.parseInt(normalized, 10);
			// 拼错时退回 0：宁可拿到代理自身的 IP（限流退化成全局），
			// 也不要盲信一个可伪造的头
			return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
		}),
} as const;

// 配置描述（用于生成 .env 文件的注释）
const configDesc = {
	NODE_ENV: "运行环境 (development | production)",
	PORT: "端口",
	JWT_SECRET: "JWT 签名密钥 (自动生成强密码)",
	JWT_EXP:
		"Token 过期时间 (支持格式: 7d=7天, 24h=24小时, 60m=60分钟, 3600s=3600秒)",
	DEMO_MODE: "演示模式 (true | false)：游客可只读浏览后台，所有写操作被拒绝",
	TRUST_PROXY:
		"前置反向代理层数：0=直连(忽略 X-Forwarded-For)，1=一层 nginx，2=CDN 再套一层。填错会导致取到错误的客户端 IP",
} as const;

// 默认值映射（用于生成 .env 文件）
const configDefaults = {
	NODE_ENV: "development",
	PORT: "3000",
	JWT_SECRET: () => randomBytes(32).toString("hex"), // 函数表示自动生成
	JWT_EXP: "7d",
	DEMO_MODE: "false",
	TRUST_PROXY: "0",
} as const;

// =================================================================
// 2. 自动化引擎 & 目录初始化
// =================================================================
const REQUIRED_DIRS = [
	DATA_DIR,
	SQLITE_DIR,
	UPLOADS_DIR,
	SYSTEM_UPLOADS_DIR,
	SOCIAL_UPLOADS_DIR,
	LOGS_DIR,
];

for (const dir of REQUIRED_DIRS) {
	if (!existsSync(dir)) {
		logger.info(`📂 目录 ${dir} 不存在，正在自动创建...`);
		mkdirSync(dir, { recursive: true });
	}
}

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
	// 必须同步抛错而非延迟 exit：走到这里时 config 就是 undefined，
	// 延迟期间下游模块（如 db/connection 顶层的 isProduction()）会先崩
	// TypeError，把排障方向从 .env 带偏到代码 bug
	throw new Error(
		`配置校验失败: ${errorDetails.map((d) => `${d.field} - ${d.message}`).join("; ")}`,
	);
}

export const config = parsed.data;
