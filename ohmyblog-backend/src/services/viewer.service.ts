// src/services/viewer.service.ts

class ViewerService {
	/** 在线连接集合。人数不单独计数，一律由 Set 大小派生 —— 两个数就不会分叉 */
	private clients = new Set<any>();

	/** 新客户端连接 */
	onConnect(ws: any) {
		this.clients.add(ws);
		this.broadcast();
	}

	/** 客户端断开 */
	onDisconnect(ws: any) {
		// 用「删除是否生效」区分第一次断开和重复的 close 事件：同一连接的
		// close 可能在不同时机触发不止一次，无条件计数会让在线数被多扣、
		// 甚至跌成负数。删不掉说明早已断开，什么都不用做
		if (!this.clients.delete(ws)) return;
		this.broadcast();
	}

	/** 向所有连接的客户端广播当前人数 */
	private broadcast() {
		const message = JSON.stringify({ count: this.clients.size });
		for (const ws of this.clients) {
			try {
				ws.send(message);
			} catch {
				// 半关闭的连接 send 会同步抛错，不接住就中断整轮广播 ——
				// 排在后面的客户端全收不到这次更新。顺手踢掉这个死连接；
				// 它的 close 事件若再来一次，上面的 delete 守卫会让它空转
				this.clients.delete(ws);
			}
		}
	}
}

export const viewerService = new ViewerService();
