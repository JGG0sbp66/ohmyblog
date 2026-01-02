import { logger } from "@bogeychan/elysia-logger";
import { pino } from "pino";
import { BusinessError } from "./errors";

const logConfig = {
    level: "info",
    hooks: {
        /**
         * 业务可预期异常不写入 error 日志（silent）
         */
        logMethod(args: any[], method: (...a: any[]) => void) {
            const payload = args[0];
            const err: unknown = payload?.err ?? payload?.error ?? payload;
            if (err instanceof BusinessError && err.silent) {
                return;
            }
            method.apply(this, args);
        },
    },
    transport: {
        targets: [
            // === 目标 1: 控制台输出 (开发用) ===
            {
                target: "pino-pretty",
                options: {
                    colorize: true,
                    translateTime: "SYS:standard",
                    ignore: "pid,hostname",
                },
            },
            // === 目标 2: 文件输出 (只记录错误) ===
            {
                target: "pino/file",
                level: "error",
                options: {
                    destination: "./logs/error.log",
                    mkdir: true,
                },
            },
        ],
    },
};

// 单独配置实例，当非http请求时也能使用
export const systemLogger = pino(logConfig);

// Elysia 日志插件
export const logPlugin = logger({ ...logConfig });
