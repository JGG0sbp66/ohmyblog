import pkg from "../../package.json";
import { userDao } from "../daos/user.dao";
import { logger } from "../plugins/logger.plugin";
import { isDemo } from "../utils/runtime";

/** 对外暴露的 commit hash 长度，与 `git rev-parse --short` 的默认位数保持一致 */
const COMMIT_HASH_LENGTH = 7;

export class HealthService {
	private commitHash: string = "unknown";
	// 默认取 package.json 版本（编译时内联进产物），本地开发/本地 Docker 构建无需额外注入
	private appVersion: string = pkg.version;
	private logger = logger.withTag("HealthService");

	constructor() {
		// 在服务初始化时就确定版本号，避免每次请求都去判断
		this.initVersionInfo();
	}

	/**
	 * 初始化版本信息：版本号优先用 CI 注入的 APP_VERSION（打 tag 发版），否则回退到 package.json；
	 * commit hash 优先从环境变量读取，失败则尝试 Git 命令
	 */
	private async initVersionInfo() {
		// CI 构建时通过 --build-arg 注入；过滤掉 Dockerfile ARG 默认值 "unknown"，
		// 避免未注入时覆盖 package.json 的正确版本
		const envVersion = process.env.APP_VERSION;
		if (envVersion && envVersion !== "unknown") {
			this.appVersion = envVersion;
		}

		// commit hash 各来源给的位数不一致（CI 注入的 github.sha 是完整 40 位，
		// 本地 git 是短哈希），因此各来源只负责给出原始值，在这里单点截断，
		// 对外始终是同一种形态；解析失败时保留默认值 "unknown"
		const resolved = await this.resolveCommitHash();
		if (resolved) {
			this.commitHash = resolved.hash.slice(0, COMMIT_HASH_LENGTH);
			this.logger.info(
				{ version: this.appVersion, commit: this.commitHash },
				`已从${resolved.source}加载版本信息`,
			);
		}
	}

	/**
	 * 解析 commit hash 的原始值，不做长度处理
	 * @returns 原始哈希与来源描述；无法确定时返回 null
	 */
	private async resolveCommitHash(): Promise<{
		hash: string;
		source: string;
	} | null> {
		// 部署环境：CI 通过 --build-arg 注入，无需依赖镜像里存在 git
		const envCommit = process.env.GIT_COMMIT?.trim();
		if (envCommit) {
			return { hash: envCommit, source: "环境变量" };
		}

		// 本地开发环境：回退到 Git 命令
		try {
			const proc = Bun.spawn(["git", "rev-parse", "HEAD"]);
			const hash = (await new Response(proc.stdout).text()).trim();
			// 非 Git 仓库时 spawn 不抛错，只是 stdout 为空，这里要显式兜住
			if (hash) {
				return { hash, source: "本地 Git 命令" };
			}
			this.logger.warn("Git 命令未返回提交哈希，将使用默认值 'unknown'");
		} catch (e) {
			this.logger.warn(
				{ err: e },
				"无法获取 Git 提交哈希，将使用默认值 'unknown'",
			);
		}
		return null;
	}

	/**
	 * 获取健康状态数据
	 * @returns 当前版本号、commit hash、是否已初始化管理员，以及演示模式是否生效
	 */
	async getSystemStatus() {
		const hasAdmin = await userDao.hasAnyAdmin();
		return {
			version: this.appVersion,
			commit: this.commitHash,
			initialized: hasAdmin,
			// 返回的是「是否真正生效」而非开关本身：未初始化时演示限制不生效，
			// 前端拿到就能直接决定要不要显示演示横幅
			demo: isDemo() && hasAdmin,
		};
	}

	getVersion() {
		return this.appVersion;
	}
}

// 导出单例，保持状态
export const healthService = new HealthService();
