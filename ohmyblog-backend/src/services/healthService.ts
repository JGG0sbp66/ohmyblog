import { systemLogger } from "../plugins/logger";

export class HealthService {
    private commitHash: string = "unknown";

    constructor() {
        // 在服务初始化时就确定版本号，避免每次请求都去判断
        this.initCommitHash();
    }

    private async initCommitHash() {
        // 策略 1: 优先读取环境变量 (Docker/生产环境)
        if (process.env.GIT_COMMIT) {
            this.commitHash = process.env.GIT_COMMIT;
            return;
        }

        // 策略 2: 尝试本地 Git 命令 (本地开发环境)
        try {
            const proc = Bun.spawn(["git", "rev-parse", "--short", "HEAD"]);
            const text = await new Response(proc.stdout).text();
            this.commitHash = text.trim();
        } catch (e) {
            // TODO: 硬编码提示
            // TODO: 添加logger.chlidren，方便记录是哪个模块发出的日志
            systemLogger.warn({ err: e }, "无法获取 Git 提交哈希，将使用默认值 'unknown'");
        }
    }

    /**
     * 获取健康状态数据
     */
    getSystemStatus() {
        return {
            version: this.commitHash,
        };
    }
}

// 导出单例，保持状态
export const healthService = new HealthService();