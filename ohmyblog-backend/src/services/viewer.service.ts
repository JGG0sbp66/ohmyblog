// src/services/viewer.service.ts

class ViewerService {
	private viewerCount = 0;
	private clients = new Set<any>();

	/** 新客户端连接 */
	onConnect(ws: any) {
		this.viewerCount++;
		this.clients.add(ws);
		this.broadcast();
	}

	/** 客户端断开 */
	onDisconnect(ws: any) {
		this.viewerCount--;
		this.clients.delete(ws);
		this.broadcast();
	}

	/** 向所有连接的客户端广播当前人数 */
	private broadcast() {
		const message = JSON.stringify({ count: this.viewerCount });
		for (const ws of this.clients) {
			ws.send(message);
		}
	}
}

export const viewerService = new ViewerService();
