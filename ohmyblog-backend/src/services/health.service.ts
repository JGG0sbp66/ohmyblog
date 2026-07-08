import { userDao } from "../daos/user.dao";
import { logger } from "../plugins/logger.plugin";

export class HealthService {
	private commitHash: string = "unknown";
	private appVersion: string = "unknown";
	private logger = logger.withTag("HealthService");

	constructor() {
		// 在服务初始化时就确定版本号，避免每次请求都去判断
		this.initVersionInfo();
	}

	/**
	 * 初始化版本信息，优先从环境变量读取，失败则尝试 Git 命令
	 */
	private async initVersionInfo() {
		// 读取语义化版本号 (由 CI 构建时注入)
		if (process.env.APP_VERSION) {
			this.appVersion = process.env.APP_VERSION;
		}

		// 读取 commit hash
		if (process.env.GIT_COMMIT) {
			this.commitHash = process.env.GIT_COMMIT;
			this.logger.info(
				{ version: this.appVersion, commit: this.commitHash },
				"已从环境变量加载版本信息",
			);
			return;
		}

		// 本地开发环境：尝试 Git 命令获取 commit hash
		try {
			const proc = Bun.spawn(["git", "rev-parse", "--short", "HEAD"]);
			const text = await new Response(proc.stdout).text();
			this.commitHash = text.trim();
			this.logger.info(
				{ version: this.appVersion, commit: this.commitHash },
				"已通过本地 Git 命令加载版本信息",
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
	 * @returns 当前版本号、commit hash 及是否已初始化管理员
	 */
	async getSystemStatus() {
		const hasAdmin = await userDao.hasAnyAdmin();
		return {
			version: this.appVersion,
			commit: this.commitHash,
			initialized: hasAdmin,
		};
	}
}

// 导出单例，保持状态
export const healthService = new HealthService();
