// src/routes/viewer.route.ts
import { Elysia } from "elysia";
import { viewerService } from "../services/viewer.service";

export const viewerRoute = new Elysia({ name: "viewerRoute" }).ws(
	"/ws/viewers",
	{
		open(ws) {
			viewerService.onConnect(ws);
		},
		close(ws) {
			viewerService.onDisconnect(ws);
		},
		message() {
			// 仅服务端推送，不处理客户端消息
		},
	},
);
