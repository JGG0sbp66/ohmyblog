// src/routes/friend-link.route.ts
import { Elysia, t } from "elysia";
import {
	ApplyFriendLinkDTO,
	FriendLinkQueryDTO,
	RejectFriendLinkDTO,
	UpdateFriendLinkDTO,
} from "../dtos/friend-link.dto";
import { ensureAdminIfExists } from "../plugins/adminGuard";
import { authPlugin } from "../plugins/auth.plugin";
import { friendLinkService } from "../services/friend-link.service";

const uuidParam = t.Object({ uuid: t.String() });

export const friendLinkRoute = new Elysia({ name: "friendLinkRoute" })
	.use(authPlugin)
	// ── 公开路由 ──────────────────────────────────────────────────────────
	.group(
		"/public/friends",
		{ detail: { tags: ["Friends (友链 - 公开)"] } },
		(app) =>
			app
				.get(
					"/",
					async () => {
						const list = await friendLinkService.getApprovedList();
						return { message: "获取成功", list };
					},
					{ detail: { summary: "获取已通过的友链列表（前台）(GET)" } },
				)
				.post(
					"/apply",
					async ({ body }) => {
						const item = await friendLinkService.apply(body);
						return { message: "申请已提交，等待审核", item };
					},
					{
						body: ApplyFriendLinkDTO,
						detail: { summary: "提交友链申请（前台）(POST)" },
					},
				),
	)
	// ── 管理员路由 ────────────────────────────────────────────────────────
	.group("/friends", { detail: { tags: ["Friends (友链 - 管理)"] } }, (app) =>
		app
			.get(
				"/",
				async ({ query }) => {
					return friendLinkService.getList(query);
				},
				{
					beforeHandle: ensureAdminIfExists,
					query: FriendLinkQueryDTO,
					detail: { summary: "分页获取友链列表（管理员）(GET)" },
				},
			)
			.get(
				"/pending-count",
				async () => {
					const count = await friendLinkService.countPending();
					return count;
				},
				{
					beforeHandle: ensureAdminIfExists,
					detail: { summary: "获取待审批友链数量（仪表盘）(GET)" },
				},
			)
			.get(
				"/:uuid",
				async ({ params }) => {
					return friendLinkService.getById(params.uuid);
				},
				{
					beforeHandle: ensureAdminIfExists,
					params: uuidParam,
					detail: { summary: "获取单条友链详情（管理员）(GET)" },
				},
			)
			.patch(
				"/:uuid/approve",
				async ({ params }) => {
					const item = await friendLinkService.approve(params.uuid);
					return { message: "已通过", item };
				},
				{
					beforeHandle: ensureAdminIfExists,
					params: uuidParam,
					detail: { summary: "审批通过友链（管理员）(PATCH)" },
				},
			)
			.patch(
				"/:uuid/reject",
				async ({ params, body }) => {
					const item = await friendLinkService.reject(params.uuid, body);
					return { message: "已拒绝", item };
				},
				{
					beforeHandle: ensureAdminIfExists,
					params: uuidParam,
					body: RejectFriendLinkDTO,
					detail: { summary: "拒绝友链申请（管理员）(PATCH)" },
				},
			)
			.put(
				"/:uuid",
				async ({ params, body }) => {
					const item = await friendLinkService.update(params.uuid, body);
					return { message: "更新成功", item };
				},
				{
					beforeHandle: ensureAdminIfExists,
					params: uuidParam,
					body: UpdateFriendLinkDTO,
					detail: { summary: "更新友链信息（管理员）(PUT)" },
				},
			)
			.delete(
				"/:uuid",
				async ({ params }) => {
					await friendLinkService.delete(params.uuid);
					return { message: "删除成功" };
				},
				{
					beforeHandle: ensureAdminIfExists,
					params: uuidParam,
					detail: { summary: "删除友链（管理员）(DELETE)" },
				},
			),
	);
