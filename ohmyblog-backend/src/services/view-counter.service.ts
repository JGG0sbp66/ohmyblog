// src/services/view-counter.service.ts
import { postDao } from "../daos/post.dao";
import { logger } from "../plugins/logger.plugin";

/**
 * 文章访问计数器（异步批量累加）
 *
 * 设计动机：
 *   - 文章详情接口是读多写极少，但原实现每次都 UPDATE viewCount + 1，
 *     在高 QPS 下写锁会阻塞读，把 SQLite 拉到几十 RPS。
 *   - 本服务把 viewCount 改为「内存累积 + 周期 flush」：
 *       1. 主流程读路径不再触发任何写
 *       2. 每次访问只在内存的 Map 上 ++
 *       3. 后台定时器或累积阈值触发批量 flush
 *
 * 容错与限制：
 *   - 进程意外崩溃时最多丢失最近一个 flush 周期内的访问数（默认 5s）。
 *     博客阅读量丢几次完全可接受。
 *   - 进程正常退出时通过 stop() 主动 flush，配合 SIGTERM/SIGINT 钩子兜底。
 *   - 多实例部署时各实例独立累积，落盘后由数据库累加，最终一致。
 */

interface ViewCounterOptions {
	/** flush 间隔（毫秒），默认 5s */
	intervalMs?: number;
	/** 累积阈值，达到后立即 flush 不等定时器，默认 200 */
	thresholdCount?: number;
}

class ViewCounterService {
	private logger = logger.withTag("ViewCounterService");
	private pending = new Map<string, number>();
	private timer: Timer | null = null;
	private flushing = false;
	private readonly intervalMs: number;
	private readonly thresholdCount: number;

	constructor(opts: ViewCounterOptions = {}) {
		this.intervalMs = opts.intervalMs ?? 5_000;
		this.thresholdCount = opts.thresholdCount ?? 200;
	}

	/**
	 * 启动后台定时 flush。在 app 启动时调用一次即可
	 */
	start() {
		if (this.timer) return;
		this.timer = setInterval(() => {
			void this.flush();
		}, this.intervalMs);
		// 不阻止进程退出
		this.timer.unref?.();
		this.logger.info(
			{ intervalMs: this.intervalMs, thresholdCount: this.thresholdCount },
			"viewCounter 已启动",
		);
	}

	/**
	 * 停止定时器并立即把剩余计数 flush 到数据库
	 * 在 SIGTERM/SIGINT 等优雅关闭流程中调用
	 */
	async stop() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		await this.flush();
		this.logger.info("viewCounter 已停止并完成最终 flush");
	}

	/**
	 * 累计一次访问（O(1)，不触发任何 IO）
	 * 累积量达到阈值时异步触发 flush，不阻塞调用方
	 */
	hit(slug: string) {
		const next = (this.pending.get(slug) ?? 0) + 1;
		this.pending.set(slug, next);

		if (this.totalPending() >= this.thresholdCount) {
			void this.flush();
		}
	}

	private totalPending(): number {
		let sum = 0;
		for (const v of this.pending.values()) sum += v;
		return sum;
	}

	/**
	 * 把内存累积的 delta 批量 UPDATE 到数据库
	 * 使用 flushing 锁防止并发 flush 重复写入
	 */
	private async flush() {
		if (this.flushing || this.pending.size === 0) return;
		this.flushing = true;

		// 把当前累积一次性"摘下来"，新累积进 fresh map，避免长锁
		const snapshot = this.pending;
		this.pending = new Map();

		try {
			for (const [slug, delta] of snapshot) {
				await postDao.addViewCount(slug, delta);
			}
		} catch (err) {
			// 失败时把 snapshot 退回到 pending，下次重试
			for (const [slug, delta] of snapshot) {
				this.pending.set(slug, (this.pending.get(slug) ?? 0) + delta);
			}
			this.logger.error({ err }, "viewCount flush 失败，已回滚到 pending");
		} finally {
			this.flushing = false;
		}
	}
}

export const viewCounterService = new ViewCounterService();
