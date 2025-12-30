import { z } from 'zod';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { systemLogger } from './plugins/logger';

type ConfigItem = {
    desc: string;
    schema: z.ZodTypeAny;
    default?: any;
    autoGen?: () => any;
};

// =================================================================
// 1. 配置定义中心
// =================================================================
const configDef = {
    PORT: {
        desc: '端口',
        schema: z.coerce.number(),
        default: 3000
    },
    JWT_SECRET: {
        desc: 'JWT 签名密钥 (自动生成强密码)',
        schema: z.string(),
        autoGen: () => randomBytes(32).toString('hex')
    },
    JWT_EXP: {
        desc: 'Token 过期时间',
        schema: z.string(),
        default: '7d'
    },
};

// =================================================================
// 2. 自动化引擎
// =================================================================
const ENV_PATH = join(process.cwd(), 'config', '.env');

async function initConfig() {
    const file = Bun.file(ENV_PATH);
    let envMap: Record<string, string> = {};

    if (!await file.exists()) {
        // 使用 Logger 替代 console
        systemLogger.warn(`⚙️  检测到 config/.env 不存在，正在自动生成...`);

        const fs = await import('node:fs');
        const dir = join(process.cwd(), 'config');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let fileContent = `# Auto-generated config\n`;

        for (const [key, value] of Object.entries(configDef)) {
            const def = value as ConfigItem;

            // @ts-ignore
            let val = def.autoGen ? def.autoGen() : (def.default ?? '');

            envMap[key] = String(val);
            fileContent += `\n# ${def.desc}\n${key}=${val}\n`;

            if (def.autoGen) {
                systemLogger.info(`🔑 已自动生成安全配置 [${key}]: \x1b[36m${val}\x1b[0m`);
            }
        }

        await Bun.write(ENV_PATH, fileContent);
        systemLogger.info(`✅ 配置文件已创建: ${ENV_PATH}`);
    } else {
        const text = await file.text();
        text.split('\n').forEach(line => {
            const [k, ...v] = line.trim().split('=');
            if (k && !k.startsWith('#')) envMap[k] = v.join('=').trim();
        });
        // systemLogger.debug(`✅ 已加载配置文件`);
    }

    return envMap;
}

const loadedEnv = await initConfig();
const mergedEnv = { ...process.env, ...loadedEnv };

// =================================================================
// 3. 构建 Schema
// =================================================================
const schemaShape: any = {};
for (const [key, value] of Object.entries(configDef)) {
    const def = value as ConfigItem;
    if (def.default !== undefined) {
        schemaShape[key] = def.schema.default(def.default);
    } else {
        schemaShape[key] = def.schema;
    }
}
const envSchema = z.object(schemaShape);

const parsed = envSchema.safeParse(mergedEnv);

if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(issue => ({
        field: issue.path.join('.') || 'ROOT',
        message: issue.message,
        code: issue.code
    }));
    // 使用 Logger 记录严重错误
    systemLogger.fatal({ err: errorDetails }, '❌ 配置校验失败，服务无法启动');
    setTimeout(() => process.exit(1), 100);
}

export const config = parsed.data as z.infer<typeof envSchema>;
