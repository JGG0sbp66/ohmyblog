import { BusinessError } from "../plugins/errors";
import { logger } from "../plugins/logger.plugin";
import { TTLCache } from "../utils/cache";

const RELEASE_API_URL =
	"https://api.github.com/repos/JGG0sbp66/ohmyblog/releases/latest";
const CACHE_KEY = "latest-release";

interface GitHubRelease {
	tag_name: string;
	html_url: string;
	published_at: string;
	draft: boolean;
	prerelease: boolean;
}

interface LatestRelease {
	version: string;
	releaseUrl: string;
	publishedAt: string;
}

export interface UpdateInfo {
	currentVersion: string;
	latestVersion: string;
	hasUpdate: boolean;
	releaseUrl: string;
	publishedAt: string;
}

class UpdateService {
	private logger = logger.withTag("UpdateService");
	private cache = new TTLCache<string, LatestRelease>({
		ttlMs: 30 * 60 * 1000,
		maxSize: 1,
	});

	async check(currentVersion: string): Promise<UpdateInfo> {
		const normalizedCurrentVersion = this.normalizeVersion(currentVersion);
		if (!normalizedCurrentVersion) {
			throw new BusinessError("当前运行版本无法用于更新检查");
		}

		const latestRelease = await this.cache.fetch(CACHE_KEY, () =>
			this.fetchLatestRelease(),
		);

		return {
			currentVersion: normalizedCurrentVersion,
			latestVersion: latestRelease.version,
			hasUpdate:
				Bun.semver.order(normalizedCurrentVersion, latestRelease.version) < 0,
			releaseUrl: latestRelease.releaseUrl,
			publishedAt: latestRelease.publishedAt,
		};
	}

	private async fetchLatestRelease(): Promise<LatestRelease> {
		try {
			const response = await fetch(RELEASE_API_URL, {
				headers: {
					Accept: "application/vnd.github+json",
					"User-Agent": "ohmyblog-update-checker",
					"X-GitHub-Api-Version": "2022-11-28",
				},
				signal: AbortSignal.timeout(5000),
			});

			if (!response.ok) {
				this.logger.warn(
					{ status: response.status },
					"GitHub Release 查询返回异常状态",
				);
				throw new BusinessError("获取最新版本失败", { status: 502 });
			}

			const release = (await response.json()) as Partial<GitHubRelease>;
			const version = this.normalizeVersion(release.tag_name);
			if (
				!version ||
				typeof release.html_url !== "string" ||
				typeof release.published_at !== "string" ||
				release.draft === true ||
				release.prerelease === true
			) {
				this.logger.warn("GitHub Release 返回了无效数据");
				throw new BusinessError("最新版本信息格式无效", { status: 502 });
			}

			return {
				version,
				releaseUrl: release.html_url,
				publishedAt: release.published_at,
			};
		} catch (error) {
			if (error instanceof BusinessError) throw error;
			this.logger.warn({ err: error }, "GitHub Release 查询失败");
			throw new BusinessError("获取最新版本失败", { status: 502 });
		}
	}

	private normalizeVersion(version: unknown): string | null {
		if (typeof version !== "string") return null;
		const normalized = version.trim().replace(/^v/i, "");
		return /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(
			normalized,
		)
			? normalized
			: null;
	}
}

export const updateService = new UpdateService();
