// src/services/viewer.service.ts

/** ViewerService 实际依赖的最小 WebSocket 能力。 */
interface ViewerSocket {
	send(message: string): unknown;
}

class ViewerService {
	/** 在线连接集合。人数不单独计数，一律由 Set 大小派生 —— 两个数就不会分叉 */
	private clients = new Set<ViewerSocket>();

	/** 新客户端连接 */
	onConnect(ws: ViewerSocket) {
		this.clients.add(ws);
		this.broadcast();
	}

	/** 客户端断开 */
	onDisconnect(ws: ViewerSocket) {
		// 用「删除是否生效」区分第一次断开和重复的 close 事件：同一连接的
		// close 可能在不同时机触发不止一次，无条件计数会让在线数被多扣、
		// 甚至跌成负数。删不掉说明早已断开，什么都不用做
		if (!this.clients.delete(ws)) return;
		this.broadcast();
	}

	/** 向所有连接的客户端广播最终在线人数。 */
	private broadcast() {
		// 一轮发送若剔除了死连接，幸存客户端刚收到的 count 已经过时，必须按
		// 最终 Set.size 再发一轮。每次继续循环都至少删除一个连接，因此集合
		// 严格缩小，最多 clients 初始大小 + 1 轮后终止。
		while (true) {
			const sizeBeforeSend = this.clients.size;
			const message = JSON.stringify({ count: sizeBeforeSend });

			for (const ws of this.clients) {
				try {
					ws.send(message);
				} catch {
					this.clients.delete(ws);
				}
			}

			if (this.clients.size === sizeBeforeSend) return;
		}
	}
}

export const viewerService = new ViewerService();
