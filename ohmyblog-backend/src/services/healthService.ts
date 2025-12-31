import { systemLogger } from "../plugins/logger";

export class HealthService {
    private commitHash: string = "unknown";
    private logger = systemLogger.child({ module: "HealthService" });

    constructor() {
        // 在服务初始化时就确定版本号，避免每次请求都去判断
        this.initCommitHash();
    }

    private async initCommitHash() {
        // 策略 1: 优先读取环境变量 (Docker/生产环境)
        if (process.env.GIT_COMMIT) {
            this.commitHash = process.env.GIT_COMMIT;
            this.logger.info(
                { commitHash: this.commitHash },
                "已从环境变量加载 Git版本",
            );
            return;
        }

        // 策略 2: 尝试本地 Git 命令 (本地开发环境)
        try {
            const proc = Bun.spawn(["git", "rev-parse", "--short", "HEAD"]);
            const text = await new Response(proc.stdout).text();
            this.commitHash = text.trim();
            this.logger.info(
                { commitHash: this.commitHash },
                "已通过本地 Git 命令加载版本",
            );
        } catch (e) {
            this.logger.warn(
                { err: e },
                "无法获取 Git 提交哈希，将使用默认值 'unknown'",
            );
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
