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
	/** 在飞的那一轮 flush 的 promise；null = 空闲。并发触发复用同一轮 */
	private flushPromise: Promise<void> | null = null;
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
	 * 停止定时器并尽力把剩余计数 flush 到数据库
	 * 在 SIGTERM/SIGINT 等优雅关闭流程中调用
	 */
	async stop() {
		if (this.timer) {
			clearInterval(this.timer);
			this.timer = null;
		}
		// 连等两轮：第一轮接住「正在飞的那一次」（flush 内部复用在飞的
		// promise，不会空转丢弃），第二轮把上一轮飞行途中新累积的部分
		// 也送走。退出路径上丢的就是这最后一两个周期的计数
		await this.flush();
		await this.flush();
		if (this.pending.size > 0) {
			// 走到这里说明数据库持续不可用。计数已无处可去，把量级记进
			// 日志再放弃 —— 进程马上要退出了，回滚到内存也救不回来
			this.logger.warn(
				{ pendingSlugs: this.pending.size, pendingHits: this.totalPending() },
				"退出时 viewCount 仍有未落库的计数，本次放弃",
			);
		}
		this.logger.info("viewCounter 已停止");
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
	 * 把内存累积的 delta 批量 UPDATE 到数据库。
	 *
	 * 已有一轮在飞时直接复用它的 promise —— 新累积留在 pending 里等下
	 * 一个周期，stop() 也因此能「等住」在飞的一轮而不是空转返回。
	 *
	 * 部分失败只回队**未落库**的条目（从失败那条起到末尾）：已成功写进
	 * 数据库的绝不能再回队 —— 旧实现整批回滚，下一轮把已落库的部分再
	 * 加一遍，阅读量凭空翻倍，恰好在「数据库时好时坏」的场景里越滚越多
	 */
	private flush(): Promise<void> {
		if (this.flushPromise) return this.flushPromise;
		if (this.pending.size === 0) return Promise.resolve();

		const run = this.runFlush();
		this.flushPromise = run;
		// 复位只关心「这一轮结束了」，成败都不影响锁的释放；
		// 直接 await flush() 的调用方仍会拿到原始的拒绝
		void run.then(
			() => {
				this.flushPromise = null;
			},
			() => {
				this.flushPromise = null;
			},
		);
		return run;
	}

	private async runFlush(): Promise<void> {
		// 把当前累积一次性"摘下来"，新累积进 fresh map，避免长锁
		const entries = [...this.pending.entries()];
		this.pending = new Map();

		let failedAt = -1;
		for (let i = 0; i < entries.length; i++) {
			const entry = entries[i];
			if (!entry) continue;
			const [slug, delta] = entry;
			try {
				await postDao.addViewCount(slug, delta);
			} catch (err) {
				// 单条失败即停：批量写一半失败基本是数据库层面的持续故障
				//（锁死 / 磁盘满），继续重试只会把同一个错误刷 N 遍
				failedAt = i;
				this.logger.error({ err, slug }, "viewCount flush 写入失败");
				break;
			}
		}

		if (failedAt >= 0) {
			for (let i = failedAt; i < entries.length; i++) {
				const entry = entries[i];
				if (!entry) continue;
				const [slug, delta] = entry;
				this.pending.set(slug, (this.pending.get(slug) ?? 0) + delta);
			}
		}
	}
}

export const viewCounterService = new ViewCounterService();
